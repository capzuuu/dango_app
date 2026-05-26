import type { Request, Response, NextFunction } from 'express';
import { env } from '../env';

export function secretHeaderGuard(req: Request, res: Response, next: NextFunction) {
  const headerName = env.DANGO_API_SECRET_HEADER_NAME;
  const provided = req.header(headerName);

  if (!provided || provided !== env.DANGO_API_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  next();
}

