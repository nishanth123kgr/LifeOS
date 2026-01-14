import { Router } from 'express';
import {
  getLifeSystems,
  getLifeSystem,
  createLifeSystem,
  updateLifeSystem,
  deleteLifeSystem,
  logAdherence,
  linkGoals,
} from '../controllers/lifeSystem.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { lifeSystemSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/', getLifeSystems);
router.get('/:id', getLifeSystem);
router.post('/', validate(lifeSystemSchema), createLifeSystem);
router.patch('/:id', updateLifeSystem);
router.delete('/:id', deleteLifeSystem);
router.post('/:id/adherence', logAdherence);
router.post('/:id/link', linkGoals);

export default router;
