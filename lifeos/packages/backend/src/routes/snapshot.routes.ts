import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { progressSnapshotService } from '../services/progressSnapshot.service.js';

const router = Router();

// Create today's snapshot
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const snapshot = await progressSnapshotService.createSnapshot(req.userId!);
    res.status(201).json({ snapshot });
  } catch (error) {
    next(error);
  }
});

// Get today's snapshot
router.get('/today', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const snapshot = await progressSnapshotService.getToday(req.userId!);
    res.json({ snapshot });
  } catch (error) {
    next(error);
  }
});

// Get snapshot history
router.get('/history', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const snapshots = await progressSnapshotService.getHistory(req.userId!, days);
    res.json({ snapshots });
  } catch (error) {
    next(error);
  }
});

// Get trends
router.get('/trends', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trends = await progressSnapshotService.getTrends(req.userId!, days);
    res.json({ trends });
  } catch (error) {
    next(error);
  }
});

// Compare periods
router.get('/compare', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { period1Start, period1End, period2Start, period2End } = req.query;
    
    const comparison = await progressSnapshotService.comparePeriods(
      req.userId!,
      new Date(period1Start as string),
      new Date(period1End as string),
      new Date(period2Start as string),
      new Date(period2End as string)
    );
    
    res.json({ comparison });
  } catch (error) {
    next(error);
  }
});

export default router;
