import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createStudyPlanSchema, updateStudyPlanSchema } from '../schemas/studyplan.schema.js';
import {
  createStudyPlan,
  getStudyPlans,
  getStudyPlanById,
  updateStudyPlan,
  deleteStudyPlan,
} from '../controllers/studyplan.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize('STUDENT'));

router.post('/', validate(createStudyPlanSchema), createStudyPlan);
router.get('/', getStudyPlans);
router.get('/:id', getStudyPlanById);
router.patch('/:id', validate(updateStudyPlanSchema), updateStudyPlan);
router.delete('/:id', deleteStudyPlan);

export default router;
