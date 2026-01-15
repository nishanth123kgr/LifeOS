import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';

// Load env first
dotenv.config();

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import financialGoalRoutes from './routes/financialGoal.routes.js';
import fitnessGoalRoutes from './routes/fitnessGoal.routes.js';
import habitRoutes from './routes/habit.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import budgetTemplateRoutes from './routes/budgetTemplate.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import accountRoutes from './routes/account.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import achievementRoutes from './routes/achievement.routes.js';
import templateRoutes from './routes/template.routes.js';
import exportRoutes from './routes/export.routes.js';
import projectionRoutes from './routes/projection.routes.js';
import searchRoutes from './routes/search.routes.js';
import journalRoutes from './routes/journal.routes.js';
import snapshotRoutes from './routes/snapshot.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { validateEnv, config } from './lib/config.js';
import logger from './lib/logger.js';
import prisma from './lib/prisma.js';

// Validate required environment variables
validateEnv();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(pinoHttp({ logger }));
app.use(express.json());

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check with database connectivity
app.get('/health', async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Health check failed - database unreachable');
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'failed',
      },
    });
  }
});

// API Routes (versioned)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/financial-goals', financialGoalRoutes);
app.use('/api/v1/fitness-goals', fitnessGoalRoutes);
app.use('/api/v1/habits', habitRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/budget-template', budgetTemplateRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/achievements', achievementRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/projections', projectionRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/journal', journalRoutes);
app.use('/api/v1/snapshots', snapshotRoutes);

// Legacy routes (redirect to v1) - for backward compatibility
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/financial-goals', financialGoalRoutes);
app.use('/api/fitness-goals', fitnessGoalRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/budget-template', budgetTemplateRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/projections', projectionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/snapshots', snapshotRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing connections...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, '🚀 LifeOS API running');
});

export default app;
