import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createJobApplicationSchema, updateJobApplicationSchema } from '../schemas/jobapplication.schema.js';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
} from '../controllers/jobapplication.controller.js';

const router = Router();

// All job application routes require authentication and STUDENT role
router.use(authenticate, authorize('STUDENT'));

router.post('/', validateRequest(createJobApplicationSchema), createApplication);
router.get('/', getApplications);
router.get('/:id', getApplicationById);
router.patch('/:id', validateRequest(updateJobApplicationSchema), updateApplication);
router.delete('/:id', deleteApplication);

export default router;
