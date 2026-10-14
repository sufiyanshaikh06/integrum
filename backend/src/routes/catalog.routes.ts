import { Router } from 'express';
import { catalogController } from '../controllers/catalog.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  getCoursesQuerySchema,
  getSubjectsQuerySchema,
  getTermsQuerySchema,
} from '../schemas/catalog.schema.js';

const router = Router();

// Catalog feeds are authenticated read-only feeds accessible to all authenticated users (STUDENT and ADMIN)
router.use(authenticate);

// GET /api/v1/catalog/departments — list departments
router.get('/departments', catalogController.getDepartments);

// GET /api/v1/catalog/courses — list courses
router.get('/courses', validateRequest(getCoursesQuerySchema), catalogController.getCourses);

// GET /api/v1/catalog/subjects — list master subjects
router.get('/subjects', validateRequest(getSubjectsQuerySchema), catalogController.getSubjects);

// GET /api/v1/catalog/terms — list academic terms
router.get('/terms', validateRequest(getTermsQuerySchema), catalogController.getTerms);

export default router;
