import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { updateProfileSchema } from '../schemas/user.schema.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// GET /users/me
router.get('/me', userController.getProfile);

// PATCH /users/me — I-3: Update Profile (I-4 careerGoals, I-5 socialLinks included)
router.patch('/me', authorize('STUDENT'), validateRequest(updateProfileSchema), userController.updateProfile);

// Admin-only test route
router.get('/admin-only', authorize('ADMIN'), (_req, res) => {
  res.json({ success: true, message: 'Admin access granted' });
});

export default router;
