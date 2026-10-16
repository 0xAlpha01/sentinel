import type { RequestHandler } from 'express';
import type { Role } from '../utils/jwt';
import { AppError } from '../utils/appError';

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new AppError(403, 'Forbidden'));
    next();
  };
