import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

export const validateBody =
  (schema: ZodSchema): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body); // ZodError is handled by errorHandler
    next();
  };
