import { Request, Response } from 'express';
import { adminPlatformService } from '../../services/admin/platform.service.js';
import { auditService } from '../../services/admin/audit.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import {
  ListAuditLogsQuery,
  ListFeedbackQuery,
  UpdateFeedbackAdminInput,
  UpdateSystemSettingInput,
} from '../../schemas/admin/platform.schema.js';

export const adminPlatformController = {
  /**
   * GET /api/v1/admin/platform/dashboard
   */
  getDashboard: asyncHandler(async (req: Request, res: Response) => {
    const metrics = await adminPlatformService.getDashboardMetrics();
    ApiResponse.success(res, 'Admin dashboard metrics retrieved successfully', metrics, HTTP_STATUS.OK);
  }),

  /**
   * GET /api/v1/admin/platform/audit-logs
   */
  listAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListAuditLogsQuery;
    const result = await auditService.listAuditLogs(query);
    ApiResponse.success(res, 'Audit logs retrieved successfully', result, HTTP_STATUS.OK);
  }),

  /**
   * GET /api/v1/admin/platform/feedback
   */
  listFeedback: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListFeedbackQuery;
    const result = await adminPlatformService.listFeedback(query);
    ApiResponse.success(res, 'Feedback records retrieved successfully', result, HTTP_STATUS.OK);
  }),

  /**
   * GET /api/v1/admin/platform/feedback/:id
   */
  getFeedbackById: asyncHandler(async (req: Request, res: Response) => {
    const feedback = await adminPlatformService.getFeedbackById(req.params.id);
    ApiResponse.success(res, 'Feedback details retrieved successfully', feedback, HTTP_STATUS.OK);
  }),

  /**
   * PATCH /api/v1/admin/platform/feedback/:id
   */
  updateFeedback: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as UpdateFeedbackAdminInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await adminPlatformService.updateFeedback(actorUserId, req.params.id, data, ipAddress);
    ApiResponse.success(res, 'Feedback status updated successfully', updated, HTTP_STATUS.OK);
  }),

  /**
   * GET /api/v1/admin/platform/settings
   */
  getSettings: asyncHandler(async (req: Request, res: Response) => {
    const settings = await adminPlatformService.getSettings();
    ApiResponse.success(res, 'System settings retrieved successfully', settings, HTTP_STATUS.OK);
  }),

  /**
   * PATCH /api/v1/admin/platform/settings/:key
   */
  updateSetting: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const rawKey = req.params.key;
    const data = req.body as UpdateSystemSettingInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await adminPlatformService.updateSetting(actorUserId, rawKey, data, ipAddress);
    ApiResponse.success(res, `System setting ${rawKey} updated successfully`, updated, HTTP_STATUS.OK);
  }),
};
