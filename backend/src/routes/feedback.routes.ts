import { Router } from 'express';
import { feedbackController } from '../controllers/feedback.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { submitFeedbackSchema } from '../schemas/admin/platform.schema.js';

const router = Router();

// POST /api/v1/feedback — Student feedback submission
router.post(
  '/',
  authenticate,
  authorize('STUDENT'),
  validateRequest(submitFeedbackSchema),
  feedbackController.submitFeedback
);

// GET /api/v1/feedback — Student feedback own-list
router.get(
  '/',
  authenticate,
  authorize('STUDENT'),
  feedbackController.getMyFeedback
);

export default router;
