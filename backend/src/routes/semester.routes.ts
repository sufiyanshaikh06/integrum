import { Router } from 'express';
import { semesterController } from '../controllers/semester.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createSemesterSchema, updateSemesterSchema } from '../schemas/semester.schema.js';

const router = Router();

// All semester routes require STUDENT role
router.use(authenticate, authorize('STUDENT'));

router.post('/', validateRequest(createSemesterSchema), semesterController.createSemester);
router.get('/', semesterController.getSemesters);
router.get('/:id', semesterController.getSemesterById);
router.patch('/:id', validateRequest(updateSemesterSchema), semesterController.updateSemester);
router.delete('/:id', semesterController.deleteSemester);

export default router;
