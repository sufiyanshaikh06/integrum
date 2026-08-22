import { Router } from 'express';
import {
  generateStudyPlan,
  analyzeResume,
  summarizeNote,
  extractKeyPoints,
  generateQuestions,
  generateFlashcards,
} from '../controllers/ai.controller.js';
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

router.post('/resume/:id/analyze', asyncHandler(analyzeResume));

// ─── AI Notes Assistant (N2-N5) ──────────────────────────────────────────────
router.post('/notes/:id/summarize', asyncHandler(summarizeNote));
router.post('/notes/:id/key-points', asyncHandler(extractKeyPoints));
router.post('/notes/:id/questions', asyncHandler(generateQuestions));
router.post('/notes/:id/flashcards', asyncHandler(generateFlashcards));

export default router;
