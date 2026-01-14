import { Router } from 'express';
import { getDashboard, getLifeScore } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getDashboard);
router.get('/life-score', getLifeScore);

export default router;
