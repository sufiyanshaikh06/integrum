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
  getResumePdfData,
  getResumeTemplates,
} from '../controllers/resume.controller.js';

const router = Router();

router.use(authenticate, authorize('STUDENT'));

// C-1: List available templates (before /:id to avoid conflict)
router.get('/templates', getResumeTemplates);

router.post('/', validateRequest(createResumeSchema), createResume);
router.get('/', getResumes);
router.get('/:id', getResumeById);
router.get('/:id/pdf', getResumePdfData); // C-2: PDF export data
router.patch('/:id', validateRequest(updateResumeSchema), updateResume);
router.delete('/:id', deleteResume);

export default router;
