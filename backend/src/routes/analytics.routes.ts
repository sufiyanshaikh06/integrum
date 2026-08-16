import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { getAnalyticsQuerySchema } from '../schemas/analytics.schema.js';
import { getStudentDashboard } from '../controllers/analytics.controller.js';

const router = Router();

// All analytics routes require authentication and STUDENT role
router.use(authenticate, authorize('STUDENT'));

router.get('/dashboard', validateRequest(getAnalyticsQuerySchema), getStudentDashboard);

export default router;
