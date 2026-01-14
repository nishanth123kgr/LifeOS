import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './errorHandler.js';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      const message = error.errors?.[0]?.message || 'Validation failed';
      next(new AppError(message, 400));
    }
  };
};
