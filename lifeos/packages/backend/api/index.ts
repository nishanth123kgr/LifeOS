import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load env first
dotenv.config();

import authRoutes from '../src/routes/auth.routes.js';
import userRoutes from '../src/routes/user.routes.js';
import financialGoalRoutes from '../src/routes/financialGoal.routes.js';
import fitnessGoalRoutes from '../src/routes/fitnessGoal.routes.js';
import habitRoutes from '../src/routes/habit.routes.js';
import budgetRoutes from '../src/routes/budget.routes.js';
import budgetTemplateRoutes from '../src/routes/budgetTemplate.routes.js';
import transactionRoutes from '../src/routes/transaction.routes.js';
import accountRoutes from '../src/routes/account.routes.js';
import dashboardRoutes from '../src/routes/dashboard.routes.js';
import achievementRoutes from '../src/routes/achievement.routes.js';
import templateRoutes from '../src/routes/template.routes.js';
import exportRoutes from '../src/routes/export.routes.js';
import projectionRoutes from '../src/routes/projection.routes.js';
import searchRoutes from '../src/routes/search.routes.js';
import journalRoutes from '../src/routes/journal.routes.js';
import snapshotRoutes from '../src/routes/snapshot.routes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { apiLimiter } from '../src/middleware/rateLimiter.js';
import { config } from '../src/lib/config.js';
import prisma from '../src/lib/prisma.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check
app.get('/health', async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', timestamp: new Date().toISOString() });
  }
});

// API Routes
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

// Error handler
app.use(errorHandler);

export default app;
