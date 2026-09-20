import { Request, Response } from 'express';
import { adminUserService } from '../../services/admin/user.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import {
  ListStudentsQuery,
  ListAdminsQuery,
  CreateAdminInput,
  UpdateUserStatusInput,
  UpdateUserRoleInput,
} from '../../schemas/admin/user.schema.js';

export const adminUserController = {
  updateStudentEnrollment: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminUserService.updateStudentEnrollment(req.user!.id, req.params.id as string, req.body, req.ip);
    ApiResponse.success(res, 'Student enrollment updated successfully', result, HTTP_STATUS.OK);
  }),
  /**
   * GET /api/v1/admin/users/students
   */
  listStudents: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListStudentsQuery;
    const result = await adminUserService.listStudents(query);
    ApiResponse.success(res, 'Student accounts retrieved successfully', result, HTTP_STATUS.OK);
  }),

  /**
   * GET /api/v1/admin/users/admins
   */
  listAdmins: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListAdminsQuery;
    const result = await adminUserService.listAdmins(query);
    ApiResponse.success(res, 'Administrator accounts retrieved successfully', result, HTTP_STATUS.OK);
  }),

  /**
   * POST /api/v1/admin/users/admins
   */
  createAdmin: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as CreateAdminInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const newAdmin = await adminUserService.createAdmin(actorUserId, data, ipAddress);
    ApiResponse.success(res, 'Administrator account created successfully', newAdmin, HTTP_STATUS.CREATED);
  }),

  /**
   * PATCH /api/v1/admin/users/:id/status
   */
  updateUserStatus: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const targetUserId = req.params.id as string;
    const data = req.body as UpdateUserStatusInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await adminUserService.updateUserStatus(actorUserId, targetUserId, data, ipAddress);
    ApiResponse.success(
      res,
      `User account ${data.isActive ? 'activated' : 'deactivated'} successfully`,
      updated,
      HTTP_STATUS.OK
    );
  }),

  /**
   * PATCH /api/v1/admin/users/:id/role
   */
  updateUserRole: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const targetUserId = req.params.id as string;
    const data = req.body as UpdateUserRoleInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await adminUserService.updateUserRole(actorUserId, targetUserId, data, ipAddress);
    ApiResponse.success(
      res,
      `User role updated to ${data.role} successfully`,
      updated,
      HTTP_STATUS.OK
    );
  }),
};
