import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createResumeSchema, updateResumeSchema } from '../schemas/resume.schema.js';
import {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
} from '../controllers/resume.controller.js';

const router = Router();

// All resume routes require authentication and STUDENT role
router.use(authenticate, authorize('STUDENT'));

router.post('/', validateRequest(createResumeSchema), createResume);
router.get('/', getResumes);
router.get('/:id', getResumeById);
router.patch('/:id', validateRequest(updateResumeSchema), updateResume);
router.delete('/:id', deleteResume);

export default router;
