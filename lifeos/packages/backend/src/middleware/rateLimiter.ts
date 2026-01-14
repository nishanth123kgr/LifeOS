import rateLimit from 'express-rate-limit';
import logger from '../lib/logger.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(
      { ip: req.ip, path: req.path },
      'Rate limit exceeded'
    );
    res.status(options.statusCode).json(options.message);
  },
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login/register attempts per window
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res, next, options) => {
    logger.warn(
      { ip: req.ip, email: req.body?.email },
      'Auth rate limit exceeded'
    );
    res.status(options.statusCode).json(options.message);
  },
});

// Password reset rate limiter (even stricter)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    status: 'error',
    message: 'Too many password reset attempts, please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
