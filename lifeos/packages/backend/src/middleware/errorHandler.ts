import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger.js';
import { config } from '../lib/config.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(
      { statusCode: err.statusCode, message: err.message, path: req.path },
      'Operational error'
    );
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  logger.error(
    { err, path: req.path, method: req.method },
    'Unexpected error'
  );

  return res.status(500).json({
    status: 'error',
    message: config.isProduction ? 'Internal server error' : err.message,
  });
};
