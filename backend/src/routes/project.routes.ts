import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createProjectSchema, updateProjectSchema } from '../schemas/project.schema.js';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js';

const router = Router();

router.use(authenticate, authorize('STUDENT'));

router.post('/', validateRequest(createProjectSchema), createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.patch('/:id', validateRequest(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;
