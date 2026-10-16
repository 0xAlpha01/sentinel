import type { CookieOptions, Request, Response } from 'express';
import { isProd } from '../../config/env';
import * as auth from './auth.service';

const COOKIE_NAME = 'refresh_token';
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req: Request, res: Response) => {
  await auth.register(req.body.email, req.body.password, req);
  res.status(201).json({ message: 'Account created' });
};

export const login = async (req: Request, res: Response) => {
  const result = await auth.login(req.body.email, req.body.password, req);
  if (result.mfaRequired) return res.json({ mfaRequired: true, mfaToken: result.mfaToken });
  res.cookie(COOKIE_NAME, result.refreshToken, cookieOptions);
  res.json({ mfaRequired: false, accessToken: result.accessToken });
};

export const loginMfa = async (req: Request, res: Response) => {
  const tokens = await auth.loginWithSecondFactor(req.body.mfaToken, req.body.code, req);
  res.cookie(COOKIE_NAME, tokens.refreshToken, cookieOptions);
  res.json({ accessToken: tokens.accessToken });
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const tokens = await auth.refresh(req.cookies?.[COOKIE_NAME], req);
    res.cookie(COOKIE_NAME, tokens.refreshToken, cookieOptions);
    res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
    throw err;
  }
};

export const logout = async (req: Request, res: Response) => {
  await auth.logout(req.user!.sessionId, req, req.user!.id);
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.status(204).end();
};

export const me = async (req: Request, res: Response) => {
  res.json(await auth.getMe(req.user!.id));
};
