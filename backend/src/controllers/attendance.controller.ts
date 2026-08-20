import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { CreateAttendanceRecordInput, UpdateAttendanceRecordInput } from '../schemas/attendance.schema.js';

function getProfileId(req: Request): string {
  const id = req.user?.studentProfile?.id;
  if (!id) throw ApiError.unauthorized('Student profile not found');
  return id;
}

export const createAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const data: CreateAttendanceRecordInput = req.body;
  const record = await attendanceService.createAttendanceRecord(studentProfileId, data);
  ApiResponse.success(res, 'Attendance record created successfully', record, 201);
});

export const getAttendanceRecords = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const subjectId = req.query.subjectId as string;
  if (!subjectId) throw ApiError.badRequest('subjectId query parameter is required');
  const records = await attendanceService.getAttendanceRecords(studentProfileId, subjectId);
  ApiResponse.success(res, 'Attendance records retrieved successfully', records);
});

export const getAttendanceRecordById = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const record = await attendanceService.getAttendanceRecordById(studentProfileId, req.params.id);
  ApiResponse.success(res, 'Attendance record retrieved successfully', record);
});

export const updateAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const data: UpdateAttendanceRecordInput = req.body;
  const record = await attendanceService.updateAttendanceRecord(studentProfileId, req.params.id, data);
  ApiResponse.success(res, 'Attendance record updated successfully', record);
});

export const deleteAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  await attendanceService.deleteAttendanceRecord(studentProfileId, req.params.id);
  ApiResponse.success(res, 'Attendance record deleted successfully', null, 204);
});

// A-4: Attendance Report
export const getAttendanceReport = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const report = await attendanceService.getAttendanceReport(studentProfileId);
  ApiResponse.success(res, 'Attendance report generated successfully', report);
});
