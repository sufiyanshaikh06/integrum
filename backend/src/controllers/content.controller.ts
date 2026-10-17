import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { Prisma } from '@prisma/client';
import {
  GetAnnouncementsQuery,
  GetEventsQuery,
  GetResourcesQuery,
} from '../schemas/content.schema.js';

/**
 * Helper to extract student institutional scope: courseId and derived departmentId.
 */
async function getStudentScope(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      courseId: true,
      course: { select: { id: true, departmentId: true } },
    },
  });

  const courseId = profile?.courseId || null;
  const departmentId = profile?.course?.departmentId || null;

  return { courseId, departmentId };
}

export const contentController = {
  /**
   * GET /api/v1/content/announcements
   * Authenticated feed of active, published announcements scoped to the requesting student.
   */
  getAnnouncements: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const now = new Date();
    const { type, priority, search } = req.query as unknown as GetAnnouncementsQuery;

    const { courseId, departmentId } = await getStudentScope(userId);

    // Build scope conditions
    const scopeConditions: Prisma.AnnouncementWhereInput[] = [{ targetScope: 'ALL' }];
    if (departmentId) {
      scopeConditions.push({ targetScope: 'DEPARTMENT', departmentId });
    }
    if (courseId) {
      scopeConditions.push({ targetScope: 'COURSE', courseId });
    }

    const where: Prisma.AnnouncementWhereInput = {
      isPublished: true,
      publishedAt: { lte: now, not: null },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
      AND: [
        { OR: scopeConditions },
        ...(type ? [{ type }] : []),
        ...(priority ? [{ priority }] : []),
        ...(search
          ? [
              {
                OR: [
                  { title: { contains: search, mode: 'insensitive' as const } },
                  { content: { contains: search, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
    };

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }],
      include: {
        author: {
          select: {
            adminProfile: { select: { firstName: true, lastName: true } },
          },
        },
        department: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true, code: true } },
      },
    });

    ApiResponse.success(res, 'Announcements feed retrieved successfully', announcements, HTTP_STATUS.OK);
  }),

  /**
   * GET /api/v1/content/events
   * Authenticated feed of institutional events scoped to the requesting student.
   */
  getEvents: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { category, upcomingOnly, search } = req.query as unknown as GetEventsQuery;
    const now = new Date();

    const { courseId, departmentId } = await getStudentScope(userId);

    const scopeConditions: Prisma.InstitutionalEventWhereInput[] = [{ targetScope: 'ALL' }];
    if (departmentId) {
      scopeConditions.push({ targetScope: 'DEPARTMENT', departmentId });
    }
    if (courseId) {
      scopeConditions.push({ targetScope: 'COURSE', courseId });
    }

    const where: Prisma.InstitutionalEventWhereInput = {
      isPublished: true,
      AND: [
        { OR: scopeConditions },
        ...(category ? [{ category }] : []),
        ...(upcomingOnly === true
          ? [
              {
                OR: [
                  { startDate: { gte: now } },
                  { endDate: { gte: now } },
                ],
              },
            ]
          : []),
        ...(search
          ? [
              {
                OR: [
                  { title: { contains: search as string, mode: 'insensitive' as const } },
                  { description: { contains: search as string, mode: 'insensitive' as const } },
                  { location: { contains: search as string, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
    };

    const events = await prisma.institutionalEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true, code: true } },
      },
    });

    ApiResponse.success(res, 'Institutional events feed retrieved successfully', events, HTTP_STATUS.OK);
  }),

  /**
   * GET /api/v1/content/resources
   * Authenticated feed of academic resources scoped to the requesting student.
   */
  getResources: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { category, search } = req.query as unknown as GetResourcesQuery;

    const { courseId, departmentId } = await getStudentScope(userId);

    const scopeConditions: Prisma.AcademicResourceWhereInput[] = [
      { departmentId: null, courseId: null }, // ALL (global resources)
    ];
    if (departmentId) {
      scopeConditions.push({ departmentId, courseId: null });
    }
    if (courseId) {
      scopeConditions.push({ courseId });
    }

    const where: Prisma.AcademicResourceWhereInput = {
      AND: [
        { OR: scopeConditions },
        ...(category ? [{ category }] : []),
        ...(search
          ? [
              {
                OR: [
                  { title: { contains: search, mode: 'insensitive' as const } },
                  { description: { contains: search, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
    };

    const resources = await prisma.academicResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true, code: true } },
      },
    });

    ApiResponse.success(res, 'Academic resources feed retrieved successfully', resources, HTTP_STATUS.OK);
  }),
};
