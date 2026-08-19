import { Router } from 'express';
import { generateStudyPlan, analyzeResume } from '../controllers/ai.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { generateStudyPlanSchema } from '../schemas/ai.schema.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All AI routes require a logged-in student
router.use(authenticate, authorize('STUDENT'));

router.post(
  '/study-plan',
  validateRequest(generateStudyPlanSchema),
  asyncHandler(generateStudyPlan)
);

router.post(
  '/resume/:id/analyze',
  asyncHandler(analyzeResume)
);

export default router;
