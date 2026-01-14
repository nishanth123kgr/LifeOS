import { Router } from 'express';
import { getProfile, updateProfile, deleteAccount } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', validate(updateProfileSchema), updateProfile);
router.delete('/account', deleteAccount);

export default router;
