import { Router } from 'express';
import { subjectController } from '../controllers/subject.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createSubjectSchema, updateSubjectSchema } from '../schemas/subject.schema.js';

const router = Router();

// All subject routes require STUDENT role
router.use(authenticate, authorize('STUDENT'));

router.post('/', validateRequest(createSubjectSchema), subjectController.createSubject);
router.get('/', subjectController.getSubjects);
router.get('/:id', subjectController.getSubjectById);
router.patch('/:id', validateRequest(updateSubjectSchema), subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);

export default router;
