import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { getAnalyticsQuerySchema, getActivityQuerySchema } from '../schemas/analytics.schema.js';
import {
  getStudentDashboard,
  getSkillsProgress,
  getPlacementReadiness,
  getActivityBreakdown,
} from '../controllers/analytics.controller.js';

const router = Router();

// All analytics routes require authentication and STUDENT role
router.use(authenticate, authorize('STUDENT'));

router.get('/dashboard', validateRequest(getAnalyticsQuerySchema), getStudentDashboard);

// AN-1: Skills progress by category + proficiency breakdown
router.get('/skills-progress', getSkillsProgress);

// AN-2: Placement readiness heuristic score
router.get('/placement-readiness', getPlacementReadiness);

// AN-3: Daily/weekly/custom activity breakdown
router.get('/activity', validateRequest(getActivityQuerySchema), getActivityBreakdown);

export default router;
