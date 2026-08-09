import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createAssignmentSchema, updateAssignmentSchema } from '../schemas/assignment.schema.js';

const router = Router();

// All assignment routes require STUDENT role
router.use(authenticate, authorize('STUDENT'));

router.post('/', validateRequest(createAssignmentSchema), assignmentController.createAssignment);
router.get('/', assignmentController.getAssignments);
router.get('/:id', assignmentController.getAssignmentById);
router.patch('/:id', validateRequest(updateAssignmentSchema), assignmentController.updateAssignment);
router.delete('/:id', assignmentController.deleteAssignment);

export default router;
