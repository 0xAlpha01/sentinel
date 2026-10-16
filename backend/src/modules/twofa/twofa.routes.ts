import { Router } from 'express';
import { z } from 'zod';
import { ah } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rateLimit';
import { validateBody } from '../../middleware/validate';
import { logEvent } from '../audit/audit.service';
import { getMe } from '../auth/auth.service';
import * as twofa from './twofa.service';

const router = Router();
router.use(authenticate);

router.post('/setup', ah(async (req, res) => {
  const me = await getMe(req.user!.id);
  res.json(await twofa.beginSetup(me.id, me.email));
}));

router.post('/enable', authLimiter, validateBody(z.object({ code: z.string().regex(/^\d{6}$/) })), ah(async (req, res) => {
  const backupCodes = await twofa.enable(req.user!.id, req.body.code);
  await logEvent('2fa_enabled', req, { userId: req.user!.id });
  res.json({ backupCodes });
}));

router.post('/disable', authLimiter, validateBody(z.object({ password: z.string().min(1).max(128) })), ah(async (req, res) => {
  await twofa.disable(req.user!.id, req.body.password);
  await logEvent('2fa_disabled', req, { userId: req.user!.id });
  res.status(204).end();
}));

export default router;
