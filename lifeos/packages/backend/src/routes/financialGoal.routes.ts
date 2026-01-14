import { Router } from 'express';
import {
  getFinancialGoals,
  getFinancialGoal,
  createFinancialGoal,
  updateFinancialGoal,
  deleteFinancialGoal,
  pauseFinancialGoal,
  archiveFinancialGoal,
} from '../controllers/financialGoal.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { financialGoalSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/', getFinancialGoals);
router.get('/:id', getFinancialGoal);
router.post('/', validate(financialGoalSchema), createFinancialGoal);
router.patch('/:id', updateFinancialGoal);
router.delete('/:id', deleteFinancialGoal);
router.post('/:id/pause', pauseFinancialGoal);
router.post('/:id/archive', archiveFinancialGoal);

export default router;
