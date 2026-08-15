import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createSkillSchema, updateSkillSchema } from '../schemas/skill.schema.js';
import {
  createSkill,
  getSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
} from '../controllers/skill.controller.js';

const router = Router();

// All skill routes require authentication and STUDENT role
router.use(authenticate, authorize('STUDENT'));

router.post('/', validateRequest(createSkillSchema), createSkill);
router.get('/', getSkills);
router.get('/:id', getSkillById);
router.patch('/:id', validateRequest(updateSkillSchema), updateSkill);
router.delete('/:id', deleteSkill);

export default router;
