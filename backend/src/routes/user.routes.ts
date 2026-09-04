import { Router } from 'express';
import { userController, uploadResume, streamResume } from '../controllers/user.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { updateProfileSchema } from '../schemas/user.schema.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { resumeUpload } from '../middleware/upload.js';
import { uploadLimiter } from '../config/limiters.js';

const router = Router();

router.use(authenticate);

// GET /users/me
router.get('/me', userController.getProfile);

// PATCH /users/me — I-3: Update Profile (I-4 careerGoals, I-5 socialLinks included)
router.patch('/me', authorize('STUDENT'), validateRequest(updateProfileSchema), userController.updateProfile);

// G2: Resume upload
router.post('/me/resume-upload', uploadLimiter, resumeUpload.single('file'), uploadResume);
router.get('/me/resume-file', streamResume);

// Admin-only test route
router.get('/admin-only', authorize('ADMIN'), (_req, res) => {
  res.json({ success: true, message: 'Admin access granted' });
});

export default router;
