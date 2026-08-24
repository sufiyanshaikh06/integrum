import { Router } from 'express';
import { adminUserController } from '../../controllers/admin/user.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  listStudentsQuerySchema,
  listAdminsQuerySchema,
  createAdminSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
} from '../../schemas/admin/user.schema.js';

const router = Router();

// GET /api/v1/admin/users/students — list students with pagination/filters/search
router.get('/students', validateRequest(listStudentsQuerySchema), adminUserController.listStudents);

// GET /api/v1/admin/users/admins — list admins with pagination/search
router.get('/admins', validateRequest(listAdminsQuerySchema), adminUserController.listAdmins);

// POST /api/v1/admin/users/admins — direct admin creation
router.post('/admins', validateRequest(createAdminSchema), adminUserController.createAdmin);

// PATCH /api/v1/admin/users/:id/status — activate / deactivate user with guards
router.patch('/:id/status', validateRequest(updateUserStatusSchema), adminUserController.updateUserStatus);

// PATCH /api/v1/admin/users/:id/role — promote / demote user with baseline provisioning & guards
router.patch('/:id/role', validateRequest(updateUserRoleSchema), adminUserController.updateUserRole);

export default router;
