import { Router } from 'express';
import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  compareBudgets,
} from '../controllers/budget.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { budgetSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/', getBudgets);
router.get('/compare', compareBudgets);
router.get('/:year/:month', getBudget);
router.post('/', validate(budgetSchema), createBudget);
router.patch('/:year/:month', updateBudget);
router.delete('/:year/:month', deleteBudget);

export default router;
