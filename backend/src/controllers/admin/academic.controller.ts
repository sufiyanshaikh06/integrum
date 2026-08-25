// @ts-nocheck
import { Request, Response } from 'express';
import { adminAcademicService } from '../../services/admin/academic.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  ListDepartmentsQuery,
  CreateCourseInput,
  UpdateCourseInput,
  ListCoursesQuery,
  CreateMasterSubjectInput,
  UpdateMasterSubjectInput,
  ListMasterSubjectsQuery,
  CreateAcademicTermInput,
  UpdateAcademicTermInput,
  ListAcademicTermsQuery,
} from '../../schemas/admin/academic.schema.js';

export const adminAcademicController = {
  // ─── DEPARTMENT CONTROLLERS ───────────────────────────────────────────────

  createDepartment: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as CreateDepartmentInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const department = await adminAcademicService.createDepartment(actorUserId, data, ipAddress);
    ApiResponse.success(res, 'Department created successfully', department, HTTP_STATUS.CREATED);
  }),

  listDepartments: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListDepartmentsQuery;
    const result = await adminAcademicService.listDepartments(query);
    ApiResponse.success(res, 'Departments retrieved successfully', result, HTTP_STATUS.OK);
  }),

  getDepartmentById: asyncHandler(async (req: Request, res: Response) => {
    const department = await adminAcademicService.getDepartmentById(req.params.id);
    ApiResponse.success(res, 'Department retrieved successfully', department, HTTP_STATUS.OK);
  }),

  updateDepartment: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as UpdateDepartmentInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await adminAcademicService.updateDepartment(actorUserId, req.params.id, data, ipAddress);
    ApiResponse.success(res, 'Department updated successfully', updated, HTTP_STATUS.OK);
  }),

  deleteDepartment: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const deleted = await adminAcademicService.deleteDepartment(actorUserId, req.params.id, ipAddress);
    ApiResponse.success(res, 'Department deleted successfully', deleted, HTTP_STATUS.OK);
  }),

  // ─── COURSE CONTROLLERS ───────────────────────────────────────────────────

  createCourse: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as CreateCourseInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const course = await adminAcademicService.createCourse(actorUserId, data, ipAddress);
    ApiResponse.success(res, 'Course created successfully', course, HTTP_STATUS.CREATED);
  }),

  listCourses: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListCoursesQuery;
    const result = await adminAcademicService.listCourses(query);
    ApiResponse.success(res, 'Courses retrieved successfully', result, HTTP_STATUS.OK);
  }),

  getCourseById: asyncHandler(async (req: Request, res: Response) => {
    const course = await adminAcademicService.getCourseById(req.params.id);
    ApiResponse.success(res, 'Course retrieved successfully', course, HTTP_STATUS.OK);
  }),

  updateCourse: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as UpdateCourseInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await adminAcademicService.updateCourse(actorUserId, req.params.id, data, ipAddress);
    ApiResponse.success(res, 'Course updated successfully', updated, HTTP_STATUS.OK);
  }),

  deleteCourse: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const deleted = await adminAcademicService.deleteCourse(actorUserId, req.params.id, ipAddress);
    ApiResponse.success(res, 'Course deleted successfully', deleted, HTTP_STATUS.OK);
  }),

  // ─── MASTER SUBJECT CONTROLLERS ───────────────────────────────────────────

  createMasterSubject: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as CreateMasterSubjectInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const masterSubject = await adminAcademicService.createMasterSubject(actorUserId, data, ipAddress);
    ApiResponse.success(res, 'Master subject created successfully', masterSubject, HTTP_STATUS.CREATED);
  }),

  listMasterSubjects: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListMasterSubjectsQuery;
    const result = await adminAcademicService.listMasterSubjects(query);
    ApiResponse.success(res, 'Master subjects retrieved successfully', result, HTTP_STATUS.OK);
  }),

  getMasterSubjectById: asyncHandler(async (req: Request, res: Response) => {
    const masterSubject = await adminAcademicService.getMasterSubjectById(req.params.id);
    ApiResponse.success(res, 'Master subject retrieved successfully', masterSubject, HTTP_STATUS.OK);
  }),

  updateMasterSubject: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as UpdateMasterSubjectInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await adminAcademicService.updateMasterSubject(actorUserId, req.params.id, data, ipAddress);
    ApiResponse.success(res, 'Master subject updated successfully', updated, HTTP_STATUS.OK);
  }),

  deleteMasterSubject: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const deleted = await adminAcademicService.deleteMasterSubject(actorUserId, req.params.id, ipAddress);
    ApiResponse.success(res, 'Master subject deleted successfully', deleted, HTTP_STATUS.OK);
  }),

  // ─── ACADEMIC TERM CONTROLLERS ───────────────────────────────────────────

  createAcademicTerm: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as CreateAcademicTermInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const term = await adminAcademicService.createAcademicTerm(actorUserId, data, ipAddress);
    ApiResponse.success(res, 'Academic term created successfully', term, HTTP_STATUS.CREATED);
  }),

  listAcademicTerms: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListAcademicTermsQuery;
    const result = await adminAcademicService.listAcademicTerms(query);
    ApiResponse.success(res, 'Academic terms retrieved successfully', result, HTTP_STATUS.OK);
  }),

  getAcademicTermById: asyncHandler(async (req: Request, res: Response) => {
    const term = await adminAcademicService.getAcademicTermById(req.params.id);
    ApiResponse.success(res, 'Academic term retrieved successfully', term, HTTP_STATUS.OK);
  }),

  updateAcademicTerm: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as UpdateAcademicTermInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await adminAcademicService.updateAcademicTerm(actorUserId, req.params.id, data, ipAddress);
    ApiResponse.success(res, 'Academic term updated successfully', updated, HTTP_STATUS.OK);
  }),

  deleteAcademicTerm: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const deleted = await adminAcademicService.deleteAcademicTerm(actorUserId, req.params.id, ipAddress);
    ApiResponse.success(res, 'Academic term deleted successfully', deleted, HTTP_STATUS.OK);
  }),
};
