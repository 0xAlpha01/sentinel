import type { Request } from 'express';
import { pool } from '../../db/pool';
import { AppError } from '../../utils/appError';
import { hashPassword, verifyPassword, dummyVerify } from '../../utils/password';
import { randomToken, sha256 } from '../../utils/crypto';
import { signAccess, signMfa, verifyMfa, type Role } from '../../utils/jwt';
import { logEvent } from '../audit/audit.service';
import { verifySecondFactor } from '../twofa/twofa.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  failed_attempts: number;
  locked_until: Date | null;
  totp_enabled: boolean;
}

export type LoginResult =
  | { mfaRequired: true; mfaToken: string }
  | { mfaRequired: false; accessToken: string; refreshToken: string };

async function createSession(user: { id: string; role: Role }, req: Request, familyId?: string) {
  const refreshToken = randomToken();
  const { rows } = await pool.query(
    `INSERT INTO sessions (user_id, family_id, token_hash, ip, user_agent, expires_at)
     VALUES ($1, COALESCE($2::uuid, gen_random_uuid()), $3, $4, $5, now() + interval '7 days')
     RETURNING id`,
    [user.id, familyId ?? null, sha256(refreshToken), req.ip ?? null, req.get('user-agent') ?? null],
  );
  const accessToken = signAccess({ sub: user.id, role: user.role, sid: rows[0].id });
  return { accessToken, refreshToken };
}

/** Counts a failed attempt and locks the account after too many. */
export async function registerFailure(user: { id: string; email: string }, req: Request) {
  const { rows } = await pool.query(
    `UPDATE users
        SET failed_attempts = failed_attempts + 1,
            locked_until = CASE WHEN failed_attempts + 1 >= $2 THEN now() + ($3 || ' minutes')::interval ELSE locked_until END
      WHERE id = $1
      RETURNING failed_attempts`,
    [user.id, MAX_FAILED_ATTEMPTS, String(LOCK_MINUTES)],
  );
  if (rows[0].failed_attempts >= MAX_FAILED_ATTEMPTS) {
    await logEvent('account_locked', req, { userId: user.id, email: user.email });
  }
}

export async function register(email: string, password: string, req: Request) {
  const hash = await hashPassword(password);
  try {
    const { rows } = await pool.query(`INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`, [email, hash]);
    await logEvent('register', req, { userId: rows[0].id, email });
  } catch (err: any) {
    if (err.code === '23505') throw new AppError(409, 'Could not create account with those details');
    throw err;
  }
}

export async function login(email: string, password: string, req: Request): Promise<LoginResult> {
  const { rows } = await pool.query<UserRow>(`SELECT * FROM users WHERE email = $1`, [email]);
  const user = rows[0];

  if (!user) {
    await dummyVerify(password); // equalise timing
    await logEvent('login_failed', req, { email, meta: { reason: 'unknown_email' } });
    throw new AppError(401, 'Invalid email or password');
  }

  if (user.locked_until && user.locked_until > new Date()) {
    await logEvent('login_locked', req, { userId: user.id, email });
    throw new AppError(429, 'Too many failed attempts. Try again later.');
  }

  const ok = await verifyPassword(user.password_hash, password).catch(() => false);
  if (!ok) {
    await registerFailure(user, req);
    await logEvent('login_failed', req, { userId: user.id, email, meta: { reason: 'bad_password' } });
    throw new AppError(401, 'Invalid email or password');
  }

  if (user.totp_enabled) {
    return { mfaRequired: true, mfaToken: signMfa(user.id) };
  }

  await pool.query(`UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1`, [user.id]);
  const tokens = await createSession(user, req);
  await logEvent('login_success', req, { userId: user.id, email });
  return { mfaRequired: false, ...tokens };
}

export async function loginWithSecondFactor(mfaToken: string, code: string, req: Request) {
  let userId: string;
  try {
    userId = verifyMfa(mfaToken);
  } catch {
    throw new AppError(401, 'Verification expired. Sign in again.');
  }

  const { rows } = await pool.query<UserRow>(`SELECT * FROM users WHERE id = $1`, [userId]);
  const user = rows[0];
  if (!user || !user.totp_enabled) throw new AppError(401, 'Verification expired. Sign in again.');
  if (user.locked_until && user.locked_until > new Date()) throw new AppError(429, 'Too many failed attempts. Try again later.');

  const ok = await verifySecondFactor(user.id, code);
  if (!ok) {
    await registerFailure(user, req);
    await logEvent('2fa_failed', req, { userId: user.id, email: user.email });
    throw new AppError(401, 'Invalid verification code');
  }

  await pool.query(`UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1`, [user.id]);
  const tokens = await createSession(user, req);
  await logEvent('login_success', req, { userId: user.id, email: user.email, meta: { mfa: true } });
  return tokens;
}

/** Rotates the refresh token. Presenting an already-used token revokes the whole token family. */
export async function refresh(refreshToken: string | undefined, req: Request) {
  if (!refreshToken) throw new AppError(401, 'No session');
  const hash = sha256(refreshToken);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT s.id, s.user_id, s.family_id, s.expires_at, s.revoked_at, u.role, u.email
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1 FOR UPDATE OF s`,
      [hash],
    );
    const session = rows[0];
    if (!session) {
      await client.query('ROLLBACK');
      throw new AppError(401, 'Invalid session');
    }

    if (session.revoked_at) {
      // Reuse of a rotated/revoked token = likely stolen. Kill the whole family.
      await client.query(`UPDATE sessions SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL`, [session.family_id]);
      await client.query('COMMIT');
      await logEvent('token_reuse_detected', req, { userId: session.user_id, email: session.email });
      throw new AppError(401, 'Invalid session');
    }

    if (session.expires_at < new Date()) {
      await client.query('ROLLBACK');
      throw new AppError(401, 'Session expired');
    }

    await client.query(`UPDATE sessions SET revoked_at = now() WHERE id = $1`, [session.id]);

    const newToken = randomToken();
    const inserted = await client.query(
      `INSERT INTO sessions (user_id, family_id, token_hash, ip, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, now() + interval '7 days') RETURNING id`,
      [session.user_id, session.family_id, sha256(newToken), req.ip ?? null, req.get('user-agent') ?? null],
    );
    await client.query('COMMIT');

    const accessToken = signAccess({ sub: session.user_id, role: session.role, sid: inserted.rows[0].id });
    return { accessToken, refreshToken: newToken };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export async function logout(sessionId: string, req: Request, userId: string) {
  await pool.query(`UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`, [sessionId]);
  await logEvent('logout', req, { userId });
}

export async function getMe(userId: string) {
  const { rows } = await pool.query(`SELECT id, email, role, totp_enabled AS "totpEnabled", created_at AS "createdAt" FROM users WHERE id = $1`, [userId]);
  if (!rows[0]) throw new AppError(404, 'User not found');
  return rows[0];
}
