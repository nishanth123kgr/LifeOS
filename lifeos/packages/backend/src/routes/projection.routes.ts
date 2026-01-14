import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { projectionService } from '../services/projection.service.js';

const router = Router();

// Get projection for a specific goal
router.get('/goal/:goalId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projection = await projectionService.getGoalProjection(req.params.goalId, req.userId!);
    res.json({ projection });
  } catch (error) {
    next(error);
  }
});

// Get projections for all goals
router.get('/all', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projections = await projectionService.getAllGoalProjections(req.userId!);
    res.json(projections);
  } catch (error) {
    next(error);
  }
});

// Calculate what-if scenario
router.post('/what-if', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentAmount, targetAmount, monthlyContribution, targetMonths, annualReturnRate } = req.body;
    
    const result = projectionService.whatIf(
      currentAmount,
      targetAmount,
      { monthlyContribution, targetMonths, annualReturnRate }
    );

    res.json({ result });
  } catch (error) {
    next(error);
  }
});

// Calculate basic projection (no auth required for calculation)
router.post('/calculate', async (req, res, next) => {
  try {
    const { currentAmount, targetAmount, targetDate, monthlyContribution, annualReturnRate } = req.body;
    
    const projection = projectionService.calculateProjection({
      currentAmount,
      targetAmount,
      targetDate: new Date(targetDate),
      monthlyContribution,
      annualReturnRate,
    });

    res.json({ projection });
  } catch (error) {
    next(error);
  }
});

// Compare goal progress
router.get('/compare/:goalId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const comparison = await projectionService.compareProgress(req.params.goalId, req.userId!);
    res.json({ comparison });
  } catch (error) {
    next(error);
  }
});

export default router;
