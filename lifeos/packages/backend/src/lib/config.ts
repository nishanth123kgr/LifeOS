import logger from './logger.js';

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    logger.fatal({ missing }, 'Missing required environment variables');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const config = {
  get jwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return secret;
  },

  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '7d';
  },

  get port(): number {
    return parseInt(process.env.PORT || '5000', 10);
  },

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  },

  get frontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  },

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },
};
