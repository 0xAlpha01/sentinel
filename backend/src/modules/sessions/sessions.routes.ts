import { Router } from 'express';
import { pool } from '../../db/pool';
import { ah } from '../../utils/asyncHandler';
import { AppError } from '../../utils/appError';
import { authenticate } from '../../middleware/authenticate';
import { logEvent } from '../audit/audit.service';

const router = Router();
router.use(authenticate);

router.get('/', ah(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, ip, user_agent AS "userAgent", created_at AS "createdAt", (id = $2) AS current
       FROM sessions WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
      ORDER BY created_at DESC`,
    [req.user!.id, req.user!.sessionId],
  );
  res.json(rows);
}));

router.delete('/:id', ah(async (req, res) => {
  const { rowCount } = await pool.query(
    `UPDATE sessions SET revoked_at = now() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
    [req.params.id, req.user!.id],
  );
  if (!rowCount) throw new AppError(404, 'Session not found');
  await logEvent('session_revoked', req, { userId: req.user!.id, meta: { sessionId: req.params.id } });
  res.status(204).end();
}));

export default router;
