import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type Role = 'user' | 'admin';
export interface AccessPayload {
  sub: string;
  role: Role;
  sid: string;
}

export const signAccess = (payload: AccessPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m', algorithm: 'HS256' });

export const verifyAccess = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload & AccessPayload;

// Short-lived token proving the password step passed; only usable at the 2FA endpoint.
export const signMfa = (userId: string) =>
  jwt.sign({ sub: userId, purpose: 'mfa' }, env.JWT_MFA_SECRET, { expiresIn: '5m', algorithm: 'HS256' });

export function verifyMfa(token: string): string {
  const payload = jwt.verify(token, env.JWT_MFA_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
  if (payload.purpose !== 'mfa' || !payload.sub) throw new Error('Invalid MFA token');
  return payload.sub;
}
