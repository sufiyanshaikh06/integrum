import { Request, Response } from 'express';
import { adminReportService } from '../../services/admin/report.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { ReportQueryInput } from '../../schemas/admin/report.schema.js';

export const adminReportController = {
  getUserReport: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportQueryInput;
    const report = await adminReportService.getUserReport(query);
    ApiResponse.success(res, 'User report generated successfully', report, HTTP_STATUS.OK);
  }),

  getAcademicReport: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportQueryInput;
    const report = await adminReportService.getAcademicReport(query);
    ApiResponse.success(res, 'Academic report generated successfully', report, HTTP_STATUS.OK);
  }),

  getUsageReport: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ReportQueryInput;
    const report = await adminReportService.getUsageReport(query);
    ApiResponse.success(res, 'Usage analytics report generated successfully', report, HTTP_STATUS.OK);
  }),

  getHealthReport: asyncHandler(async (req: Request, res: Response) => {
    const report = await adminReportService.getPlatformHealthReport();
    ApiResponse.success(res, 'Platform health report generated successfully', report, HTTP_STATUS.OK);
  }),
};
