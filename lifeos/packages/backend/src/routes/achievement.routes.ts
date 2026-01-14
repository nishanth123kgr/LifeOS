import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { achievementService } from '../services/achievement.service.js';

const router = Router();

// Seed achievements (admin/init endpoint)
router.post('/seed', async (req, res: Response, next: NextFunction) => {
  try {
    await achievementService.seedAchievements();
    res.json({ success: true, message: 'Achievements seeded successfully' });
  } catch (error) {
    next(error);
  }
});

// Get all achievements with user's unlock status
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const achievements = await achievementService.getAllForUser(req.userId!);
    res.json({ achievements });
  } catch (error) {
    next(error);
  }
});

// Get user's unlocked achievements
router.get('/unlocked', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const achievements = await achievementService.getUserAchievements(req.userId!);
    const totalPoints = await achievementService.getTotalPoints(req.userId!);
    res.json({ achievements, totalPoints });
  } catch (error) {
    next(error);
  }
});

// Check and unlock new achievements
router.post('/check', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const newlyUnlocked = await achievementService.checkAndUnlock(req.userId!);
    res.json({ 
      newlyUnlocked,
      count: newlyUnlocked.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get total points
router.get('/points', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const totalPoints = await achievementService.getTotalPoints(req.userId!);
    res.json({ totalPoints });
  } catch (error) {
    next(error);
  }
});

// Seed achievements (admin only, for initial setup)
router.post('/seed', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await achievementService.seedAchievements();
    res.json({ success: true, message: 'Achievements seeded' });
  } catch (error) {
    next(error);
  }
});

export default router;
