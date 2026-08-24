import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

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
    const { departmentId, search } = req.query;

    const where: any = {};
    if (departmentId) where.departmentId = departmentId as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
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
    const { courseId, semesterNumber, search } = req.query;

    const where: any = {};
    if (courseId) where.courseId = courseId as string;
    if (semesterNumber) where.semesterNumber = Number(semesterNumber);
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
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
    const { isActive } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    const terms = await prisma.academicTerm.findMany({
      where,
      orderBy: [{ academicYear: 'desc' }, { startDate: 'desc' }],
    });

    ApiResponse.success(res, 'Academic terms retrieved successfully', terms, HTTP_STATUS.OK);
  }),
};
