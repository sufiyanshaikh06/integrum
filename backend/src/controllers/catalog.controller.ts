import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import {
  GetCoursesQuery,
  GetSubjectsQuery,
  GetTermsQuery,
} from '../schemas/catalog.schema.js';

export const catalogController = {
  /**
   * GET /api/v1/catalog/departments
   * Returns list of all departments with their associated courses.
   */
  getDepartments: asyncHandler(async (req: Request, res: Response) => {
    const departments = await prisma.department.findMany({
      orderBy: { code: 'asc' },
      include: {
        courses: {
          select: {
            id: true,
            name: true,
            code: true,
            durationYears: true,
            totalSemesters: true,
          },
          orderBy: { code: 'asc' },
        },
      },
    });

    ApiResponse.success(res, 'Departments catalog retrieved successfully', departments, HTTP_STATUS.OK);
  }),

  /**
   * GET /api/v1/catalog/courses
   * Returns list of degree programs / courses, optionally filtered by departmentId.
   */
  getCourses: asyncHandler(async (req: Request, res: Response) => {
    const { departmentId, search } = req.query as unknown as GetCoursesQuery;

    const where: Prisma.CourseWhereInput = {};
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { masterSubjects: true },
        },
      },
    });

    ApiResponse.success(res, 'Courses catalog retrieved successfully', courses, HTTP_STATUS.OK);
  }),

  /**
   * GET /api/v1/catalog/subjects
   * Returns list of standard master subjects, optionally filtered by courseId and semesterNumber.
   */
  getSubjects: asyncHandler(async (req: Request, res: Response) => {
    const { courseId, semesterNumber, search } = req.query as unknown as GetSubjectsQuery;

    const where: Prisma.MasterSubjectWhereInput = {};
    if (courseId) where.courseId = courseId;
    if (semesterNumber !== undefined) where.semesterNumber = semesterNumber;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const subjects = await prisma.masterSubject.findMany({
      where,
      orderBy: [{ semesterNumber: 'asc' }, { code: 'asc' }],
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    ApiResponse.success(res, 'Master subjects catalog retrieved successfully', subjects, HTTP_STATUS.OK);
  }),

  /**
   * GET /api/v1/catalog/terms
   * Returns institutional academic terms, optionally filtered by isActive.
   */
  getTerms: asyncHandler(async (req: Request, res: Response) => {
    const { isActive } = req.query as unknown as GetTermsQuery;

    const where: Prisma.AcademicTermWhereInput = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const terms = await prisma.academicTerm.findMany({
      where,
      orderBy: [{ academicYear: 'desc' }, { startDate: 'desc' }],
    });

    ApiResponse.success(res, 'Academic terms retrieved successfully', terms, HTTP_STATUS.OK);
  }),
};
