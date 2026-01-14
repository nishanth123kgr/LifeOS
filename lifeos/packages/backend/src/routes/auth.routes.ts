import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../schemas/index.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply stricter rate limiting to auth endpoints
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', authenticate, getMe);

export default router;
