import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { CreateAttendanceRecordInput, UpdateAttendanceRecordInput } from '../schemas/attendance.schema.js';

export const createAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const data: CreateAttendanceRecordInput = req.body;
  const record = await attendanceService.createAttendanceRecord(studentProfileId, data);
  ApiResponse.success(res, 'Attendance record created successfully', record, 201);
});

export const getAttendanceRecords = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const subjectId = req.query.subjectId as string;
  if (!subjectId) throw ApiError.badRequest('subjectId query parameter is required');

  const records = await attendanceService.getAttendanceRecords(studentProfileId, subjectId);
  ApiResponse.success(res, 'Attendance records retrieved successfully', records);
});

export const getAttendanceRecordById = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const record = await attendanceService.getAttendanceRecordById(studentProfileId, req.params.id);
  ApiResponse.success(res, 'Attendance record retrieved successfully', record);
});

export const updateAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const data: UpdateAttendanceRecordInput = req.body;
  const record = await attendanceService.updateAttendanceRecord(studentProfileId, req.params.id, data);
  ApiResponse.success(res, 'Attendance record updated successfully', record);
});

export const deleteAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  await attendanceService.deleteAttendanceRecord(studentProfileId, req.params.id);
  ApiResponse.success(res, 'Attendance record deleted successfully', null, 204);
});
