import { Router } from 'express';
import { ah } from '../../utils/asyncHandler';
import { validateBody } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimit';
import { authenticate } from '../../middleware/authenticate';
import { loginSchema, mfaLoginSchema, registerSchema } from './auth.schema';
import * as c from './auth.controller';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), ah(c.register));
router.post('/login', authLimiter, validateBody(loginSchema), ah(c.login));
router.post('/2fa', authLimiter, validateBody(mfaLoginSchema), ah(c.loginMfa));
router.post('/refresh', ah(c.refresh));
router.post('/logout', authenticate, ah(c.logout));
router.get('/me', authenticate, ah(c.me));

export default router;
