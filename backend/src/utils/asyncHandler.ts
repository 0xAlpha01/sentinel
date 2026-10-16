import type { Request, RequestHandler, Response } from 'express';

// Express 4 doesn't catch rejected promises on its own; this forwards them to errorHandler.
export const ah =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };
