import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { config } from '../lib/config.js';
import logger from '../lib/logger.js';

export interface AuthRequest extends Request {
  userId?: string;
}

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn({ error: error.message }, 'Invalid JWT token');
      return next(new AppError('Invalid token', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('JWT token expired');
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};
