import { Router } from 'express';
import { adminReportController } from '../../controllers/admin/report.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { reportQuerySchema } from '../../schemas/admin/report.schema.js';

const router = Router();

// GET /api/v1/admin/reports/users — User registrations, breakdown, rates
router.get('/users', validateRequest(reportQuerySchema), adminReportController.getUserReport);

// GET /api/v1/admin/reports/academics — Academic performance, attendance, assignment completion
router.get('/academics', validateRequest(reportQuerySchema), adminReportController.getAcademicReport);

// GET /api/v1/admin/reports/usage — AI executions, duration & career funnel metrics
router.get('/usage', validateRequest(reportQuerySchema), adminReportController.getUsageReport);

// GET /api/v1/admin/reports/health — Uptime, DB latency, memory & runtime telemetry
router.get('/health', adminReportController.getHealthReport);

export default router;
