import { Router } from 'express';
import {
  getBudgetTemplate,
  updateBudgetTemplate,
  addGoalToTemplate,
  removeGoalFromTemplate,
} from '../controllers/budgetTemplate.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getBudgetTemplate);
router.put('/', updateBudgetTemplate);
router.post('/goals', addGoalToTemplate);
router.delete('/goals/:goalId', removeGoalFromTemplate);

export default router;
