import { Router } from 'express';
import {
  getFitnessGoals,
  getFitnessGoal,
  createFitnessGoal,
  updateFitnessGoal,
  deleteFitnessGoal,
  resetFitnessGoal,
} from '../controllers/fitnessGoal.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { fitnessGoalSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/', getFitnessGoals);
router.get('/:id', getFitnessGoal);
router.post('/', validate(fitnessGoalSchema), createFitnessGoal);
router.patch('/:id', updateFitnessGoal);
router.delete('/:id', deleteFitnessGoal);
router.post('/:id/reset', resetFitnessGoal);

export default router;
