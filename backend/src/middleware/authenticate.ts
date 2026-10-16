import type { RequestHandler } from 'express';
import { pool } from '../db/pool';
import { verifyAccess } from '../utils/jwt';
import { AppError } from '../utils/appError';

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.get('authorization');
    if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Authentication required');

    let payload;
    try {
      payload = verifyAccess(header.slice(7));
    } catch {
      throw new AppError(401, 'Invalid or expired token');
    }

    // Check the session is still active so revoking a session takes effect immediately.
    const { rowCount } = await pool.query(
      `SELECT 1 FROM sessions WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > now()`,
      [payload.sid, payload.sub],
    );
    if (!rowCount) throw new AppError(401, 'Session is no longer active');

    req.user = { id: payload.sub, role: payload.role, sessionId: payload.sid };
    next();
  } catch (err) {
    next(err);
  }
};
