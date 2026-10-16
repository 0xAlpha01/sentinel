import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { pool } from '../../db/pool';
import { AppError } from '../../utils/appError';
import { decrypt, encrypt, sha256 } from '../../utils/crypto';
import { verifyPassword } from '../../utils/password';

authenticator.options = { window: 1 };

export async function beginSetup(userId: string, email: string) {
  const { rows } = await pool.query(`SELECT totp_enabled FROM users WHERE id = $1`, [userId]);
  if (rows[0]?.totp_enabled) throw new AppError(400, 'Two-factor authentication is already on');

  const secret = authenticator.generateSecret();
  await pool.query(`UPDATE users SET totp_secret_enc = $2 WHERE id = $1`, [userId, encrypt(secret)]);
  const otpauthUrl = authenticator.keyuri(email, 'Sentinel', secret);
  return { secret, qrDataUrl: await QRCode.toDataURL(otpauthUrl) };
}

export async function enable(userId: string, code: string) {
  const { rows } = await pool.query(`SELECT totp_secret_enc, totp_enabled FROM users WHERE id = $1`, [userId]);
  const user = rows[0];
  if (!user?.totp_secret_enc) throw new AppError(400, 'Start setup first');
  if (user.totp_enabled) throw new AppError(400, 'Two-factor authentication is already on');
  if (!authenticator.check(code, decrypt(user.totp_secret_enc))) throw new AppError(400, 'Invalid code');

  const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex')); // 10 hex chars
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE users SET totp_enabled = TRUE WHERE id = $1`, [userId]);
    await client.query(`DELETE FROM backup_codes WHERE user_id = $1`, [userId]);
    for (const c of backupCodes) {
      await client.query(`INSERT INTO backup_codes (user_id, code_hash) VALUES ($1, $2)`, [userId, sha256(c)]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return backupCodes; // shown once, only hashes are stored
}

export async function disable(userId: string, password: string) {
  const { rows } = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
  if (!rows[0] || !(await verifyPassword(rows[0].password_hash, password).catch(() => false))) {
    throw new AppError(401, 'Incorrect password');
  }
  await pool.query(`UPDATE users SET totp_enabled = FALSE, totp_secret_enc = NULL WHERE id = $1`, [userId]);
  await pool.query(`DELETE FROM backup_codes WHERE user_id = $1`, [userId]);
}

/** Accepts a 6-digit authenticator code or a one-time backup code. */
export async function verifySecondFactor(userId: string, code: string): Promise<boolean> {
  const cleaned = code.replace(/\s|-/g, '').toLowerCase();
  if (/^\d{6}$/.test(cleaned)) {
    const { rows } = await pool.query(`SELECT totp_secret_enc FROM users WHERE id = $1`, [userId]);
    return !!rows[0]?.totp_secret_enc && authenticator.check(cleaned, decrypt(rows[0].totp_secret_enc));
  }
  const { rowCount } = await pool.query(
    `UPDATE backup_codes SET used_at = now() WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL`,
    [userId, sha256(cleaned)],
  );
  return !!rowCount;
}
