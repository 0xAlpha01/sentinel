import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../db/pool';
import { ah } from '../../utils/asyncHandler';
import { AppError } from '../../utils/appError';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import { logEvent } from '../audit/audit.service';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/stats', ah(async (_req, res) => {
  const [sessions, failed, users, suspicious] = await Promise.all([
    pool.query(`SELECT count(*)::int AS n FROM sessions WHERE revoked_at IS NULL AND expires_at > now()`),
    pool.query(`SELECT count(*)::int AS n FROM audit_logs WHERE event = 'login_failed' AND created_at > now() - interval '24 hours'`),
    pool.query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE totp_enabled)::int AS with2fa FROM users`),
    pool.query(`SELECT count(*)::int AS n FROM audit_logs WHERE event IN ('token_reuse_detected','account_locked') AND created_at > now() - interval '24 hours'`),
  ]);
  const { total, with2fa } = users.rows[0];
  res.json({
    activeSessions: sessions.rows[0].n,
    failedLogins24h: failed.rows[0].n,
    twoFaPercent: total ? Math.round((with2fa / total) * 100) : 0,
    suspicious24h: suspicious.rows[0].n,
    totalUsers: total,
  });
}));

router.get('/suspicious', ah(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, user_id AS "userId", email, event, ip, created_at AS "createdAt"
       FROM audit_logs
      WHERE event IN ('token_reuse_detected','account_locked') AND created_at > now() - interval '24 hours'
      ORDER BY created_at DESC LIMIT 10`,
  );
  res.json(rows);
}));

router.get('/audit', ah(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const event = typeof req.query.event === 'string' ? req.query.event : null;
  const { rows } = await pool.query(
    `SELECT id, email, event, ip, created_at AS "createdAt"
       FROM audit_logs WHERE ($1::text IS NULL OR event = $1) ORDER BY created_at DESC LIMIT $2`,
    [event, limit],
  );
  res.json(rows);
}));

router.get('/users', ah(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, email, role, totp_enabled AS "totpEnabled", created_at AS "createdAt" FROM users ORDER BY created_at DESC LIMIT 200`,
  );
  res.json(rows);
}));

router.patch('/users/:id/role', validateBody(z.object({ role: z.enum(['user', 'admin']) })), ah(async (req, res) => {
  if (req.params.id === req.user!.id) throw new AppError(400, 'You cannot change your own role');
  const { rowCount } = await pool.query(`UPDATE users SET role = $2 WHERE id = $1`, [req.params.id, req.body.role]);
  if (!rowCount) throw new AppError(404, 'User not found');
  await logEvent('role_changed', req, { userId: req.user!.id, meta: { target: req.params.id, role: req.body.role } });
  res.status(204).end();
}));

router.post('/users/:id/revoke-sessions', ah(async (req, res) => {
  await pool.query(`UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [req.params.id]);
  await logEvent('sessions_revoked_by_admin', req, { userId: req.user!.id, meta: { target: req.params.id } });
  res.status(204).end();
}));

export default router;
