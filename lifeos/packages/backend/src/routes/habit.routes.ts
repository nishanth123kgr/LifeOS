import { Router } from 'express';
import {
  getHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  checkInHabit,
  uncheckHabit,
} from '../controllers/habit.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { habitSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/', getHabits);
router.get('/:id', getHabit);
router.post('/', validate(habitSchema), createHabit);
router.patch('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/check-in', checkInHabit);
router.post('/:id/uncheck', uncheckHabit);

export default router;
