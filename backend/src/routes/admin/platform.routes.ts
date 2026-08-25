import { Router } from 'express';
import { adminPlatformController } from '../../controllers/admin/platform.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  listAuditLogsQuerySchema,
  listFeedbackQuerySchema,
  updateFeedbackAdminSchema,
  updateSystemSettingSchema,
} from '../../schemas/admin/platform.schema.js';

const router = Router();

// GET /api/v1/admin/platform/dashboard — system metrics aggregations
router.get('/dashboard', adminPlatformController.getDashboard);

// GET /api/v1/admin/platform/audit-logs — append-only audit log inspection
router.get('/audit-logs', validateRequest(listAuditLogsQuerySchema), adminPlatformController.listAuditLogs);

// ─── FEEDBACK MANAGEMENT ───────────────────────────────────────────────────
router.get('/feedback', validateRequest(listFeedbackQuerySchema), adminPlatformController.listFeedback);
router.get('/feedback/:id', adminPlatformController.getFeedbackById);
router.patch('/feedback/:id', validateRequest(updateFeedbackAdminSchema), adminPlatformController.updateFeedback);

// ─── SYSTEM SETTINGS ───────────────────────────────────────────────────────
router.get('/settings', adminPlatformController.getSettings);
router.patch('/settings/:key', validateRequest(updateSystemSettingSchema), adminPlatformController.updateSetting);

export default router;
