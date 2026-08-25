import { Prisma, ContentTargetScope } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  ListAnnouncementsQuery,
  CreateInstitutionalEventInput,
  UpdateInstitutionalEventInput,
  ListInstitutionalEventsQuery,
  CreateAcademicResourceInput,
  UpdateAcademicResourceInput,
  ListAcademicResourcesQuery,
} from '../../schemas/admin/content.schema.js';

// ─── AUDIT ACTION CONSTANTS ───────────────────────────────────────────────────

export const CONTENT_AUDIT_ACTIONS = {
  ANNOUNCEMENT_CREATED: 'ANNOUNCEMENT_CREATED',
  ANNOUNCEMENT_UPDATED: 'ANNOUNCEMENT_UPDATED',
  ANNOUNCEMENT_PUBLISHED: 'ANNOUNCEMENT_PUBLISHED',
  ANNOUNCEMENT_UNPUBLISHED: 'ANNOUNCEMENT_UNPUBLISHED',
  ANNOUNCEMENT_DELETED: 'ANNOUNCEMENT_DELETED',

  INSTITUTIONAL_EVENT_CREATED: 'INSTITUTIONAL_EVENT_CREATED',
  INSTITUTIONAL_EVENT_UPDATED: 'INSTITUTIONAL_EVENT_UPDATED',
  INSTITUTIONAL_EVENT_DELETED: 'INSTITUTIONAL_EVENT_DELETED',

  ACADEMIC_RESOURCE_CREATED: 'ACADEMIC_RESOURCE_CREATED',
  ACADEMIC_RESOURCE_UPDATED: 'ACADEMIC_RESOURCE_UPDATED',
  ACADEMIC_RESOURCE_DELETED: 'ACADEMIC_RESOURCE_DELETED',
} as const;

/**
 * Normalizes scope targeting for Announcements and Events.
 * Verifies foreign references exist in database and clears irrelevant IDs.
 */
async function resolveScopeTargeting(
  scope: ContentTargetScope,
  departmentId?: string | null,
  courseId?: string | null
): Promise<{ departmentId: string | null; courseId: string | null }> {
  if (scope === 'ALL') {
    return { departmentId: null, courseId: null };
  }

  if (scope === 'DEPARTMENT') {
    if (!departmentId) {
      throw ApiError.badRequest('departmentId is required when targetScope is DEPARTMENT');
    }
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      throw ApiError.notFound('Referenced department does not exist');
    }
    return { departmentId, courseId: null };
  }

  if (scope === 'COURSE') {
    if (!courseId) {
      throw ApiError.badRequest('courseId is required when targetScope is COURSE');
    }
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw ApiError.notFound('Referenced course does not exist');
    }
    return { departmentId: null, courseId };
  }

  return { departmentId: null, courseId: null };
}

/**
 * Normalizes resource targeting:
 * Course takes precedence (department is derived/null), otherwise Department, otherwise ALL (both null).
 */
async function resolveResourceTargeting(
  departmentId?: string | null,
  courseId?: string | null
): Promise<{ departmentId: string | null; courseId: string | null }> {
  if (courseId) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw ApiError.notFound('Referenced course does not exist');
    }
    return { departmentId: null, courseId };
  }

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      throw ApiError.notFound('Referenced department does not exist');
    }
    return { departmentId, courseId: null };
  }

  return { departmentId: null, courseId: null };
}

export const adminContentService = {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. ANNOUNCEMENTS & NOTICES
  // ───────────────────────────────────────────────────────────────────────────

  async createAnnouncement(
    actorUserId: string,
    data: CreateAnnouncementInput,
    ipAddress?: string
  ) {
    const scopeData = await resolveScopeTargeting(
      data.targetScope || 'ALL',
      data.departmentId,
      data.courseId
    );

    return prisma.$transaction(async (tx) => {
      const announcement = await tx.announcement.create({
        data: {
          type: data.type || 'ANNOUNCEMENT',
          title: data.title,
          content: data.content,
          priority: data.priority || 'MEDIUM',
          targetScope: data.targetScope || 'ALL',
          departmentId: scopeData.departmentId,
          courseId: scopeData.courseId,
          isPublished: false,
          publishedAt: null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          authorUserId: actorUserId,
        },
        include: {
          department: { select: { id: true, name: true, code: true } },
          course: { select: { id: true, name: true, code: true } },
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: CONTENT_AUDIT_ACTIONS.ANNOUNCEMENT_CREATED,
          targetType: 'Announcement',
          targetId: announcement.id,
          details: {
            title: announcement.title,
            type: announcement.type,
            targetScope: announcement.targetScope,
          },
          ipAddress: ipAddress ?? null,
        },
      });

      return announcement;
    });
  },

  async listAnnouncements(query: ListAnnouncementsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const isPublishedFilter =
      query.isPublished === true || (query.isPublished as any) === 'true'
        ? true
        : query.isPublished === false || (query.isPublished as any) === 'false'
        ? false
        : undefined;

    const where: Prisma.AnnouncementWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.targetScope ? { targetScope: query.targetScope } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(isPublishedFilter !== undefined ? { isPublished: isPublishedFilter } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.announcement.count({ where }),
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              adminProfile: { select: { firstName: true, lastName: true } },
            },
          },
          department: { select: { id: true, name: true, code: true } },
          course: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getAnnouncementById(id: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            adminProfile: { select: { firstName: true, lastName: true } },
          },
        },
        department: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true, code: true } },
      },
    });

    if (!announcement) throw ApiError.notFound('Announcement not found');
    return announcement;
  },

  async updateAnnouncement(
    actorUserId: string,
    id: string,
    data: UpdateAnnouncementInput,
    ipAddress?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.announcement.findUnique({ where: { id } });
      if (!existing) throw ApiError.notFound('Announcement not found');

      const effectiveScope = data.targetScope || existing.targetScope;
      let effectiveDeptId = data.departmentId !== undefined ? data.departmentId : existing.departmentId;
      let effectiveCourseId = data.courseId !== undefined ? data.courseId : existing.courseId;

      // If scope is changing, resolve and clear non-matching IDs
      if (data.targetScope && data.targetScope !== existing.targetScope) {
        if (data.targetScope === 'ALL') {
          effectiveDeptId = null;
          effectiveCourseId = null;
        } else if (data.targetScope === 'DEPARTMENT') {
          effectiveCourseId = null;
          if (!data.departmentId) {
            throw ApiError.badRequest('departmentId is required when transitioning targetScope to DEPARTMENT');
          }
        } else if (data.targetScope === 'COURSE') {
          effectiveDeptId = null;
          if (!data.courseId) {
            throw ApiError.badRequest('courseId is required when transitioning targetScope to COURSE');
          }
        }
      }

      const scopeData = await resolveScopeTargeting(
        effectiveScope,
        effectiveDeptId,
        effectiveCourseId
      );

      const updated = await tx.announcement.update({
        where: { id },
        data: {
          ...(data.type ? { type: data.type } : {}),
          ...(data.title ? { title: data.title } : {}),
          ...(data.content ? { content: data.content } : {}),
          ...(data.priority ? { priority: data.priority } : {}),
          ...(data.targetScope ? { targetScope: data.targetScope } : {}),
          departmentId: scopeData.departmentId,
          courseId: scopeData.courseId,
          ...(data.expiresAt !== undefined
            ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }
            : {}),
        },
        include: {
          department: { select: { id: true, name: true, code: true } },
          course: { select: { id: true, name: true, code: true } },
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: CONTENT_AUDIT_ACTIONS.ANNOUNCEMENT_UPDATED,
          targetType: 'Announcement',
          targetId: id,
          details: { previous: existing, updated: data },
          ipAddress: ipAddress ?? null,
        },
      });

      return updated;
    });
  },

  async publishAnnouncement(actorUserId: string, id: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.announcement.findUnique({ where: { id } });
      if (!existing) throw ApiError.notFound('Announcement not found');

      const published = await tx.announcement.update({
        where: { id },
        data: {
          isPublished: true,
          publishedAt: new Date(),
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: CONTENT_AUDIT_ACTIONS.ANNOUNCEMENT_PUBLISHED,
          targetType: 'Announcement',
          targetId: id,
          details: { title: existing.title, publishedAt: published.publishedAt },
          ipAddress: ipAddress ?? null,
        },
      });

      return published;
    });
  },

  async unpublishAnnouncement(actorUserId: string, id: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.announcement.findUnique({ where: { id } });
      if (!existing) throw ApiError.notFound('Announcement not found');

      const unpublished = await tx.announcement.update({
        where: { id },
        data: {
          isPublished: false,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: CONTENT_AUDIT_ACTIONS.ANNOUNCEMENT_UNPUBLISHED,
          targetType: 'Announcement',
          targetId: id,
          details: { title: existing.title },
          ipAddress: ipAddress ?? null,
        },
      });

      return unpublished;
    });
  },

  async deleteAnnouncement(actorUserId: string, id: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.announcement.findUnique({ where: { id } });
      if (!existing) throw ApiError.notFound('Announcement not found');

      const deleted = await tx.announcement.delete({ where: { id } });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: CONTENT_AUDIT_ACTIONS.ANNOUNCEMENT_DELETED,
          targetType: 'Announcement',
          targetId: id,
          details: { title: existing.title, type: existing.type },
          ipAddress: ipAddress ?? null,
        },
      });

      return deleted;
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 2. INSTITUTIONAL EVENTS
  // ───────────────────────────────────────────────────────────────────────────

  async createEvent(
    actorUserId: string,
    data: CreateInstitutionalEventInput,
    ipAddress?: string
  ) {
    const scopeData = await resolveScopeTargeting(
      data.targetScope || 'ALL',
      data.departmentId,
      data.courseId
    );

    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    if (endDate && endDate < startDate) {
      throw ApiError.badRequest('endDate must not be before startDate');
    }

    return prisma.$transaction(async (tx) => {
      const event = await tx.institutionalEvent.create({
        data: {
          title: data.title,
          description: data.description ?? null,
          category: data.category || 'COLLEGE_EVENT',
          startDate,
          endDate: endDate ?? null,
          location: data.location ?? null,
          targetScope: data.targetScope || 'ALL',
          departmentId: scopeData.departmentId,
          courseId: scopeData.courseId,
          isPublished: data.isPublished !== undefined ? data.isPublished : true,
          createdByUserId: actorUserId,
        },
        include: {
          department: { select: { id: true, name: true, code: true } },
          course: { select: { id: true, name: true, code: true } },
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: CONTENT_AUDIT_ACTIONS.INSTITUTIONAL_EVENT_CREATED,
          targetType: 'InstitutionalEvent',
          targetId: event.id,
          details: { title: event.title, category: event.category, targetScope: event.targetScope },
          ipAddress: ipAddress ?? null,
        },
      });

      return event;
    });
  },

  async listEvents(query: ListInstitutionalEventsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const isPublishedFilter =
      query.isPublished === true || (query.isPublished as any) === 'true'
        ? true
        : query.isPublished === false || (query.isPublished as any) === 'false'
        ? false
        : undefined;

    const where: Prisma.InstitutionalEventWhereInput = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.targetScope ? { targetScope: query.targetScope } : {}),
      ...(isPublishedFilter !== undefined ? { isPublished: isPublishedFilter } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.institutionalEvent.count({ where }),
      prisma.institutionalEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
        include: {
          createdByUser: {
            select: {
              id: true,
              email: true,
              adminProfile: { select: { firstName: true, lastName: true } },
            },
          },
          department: { select: { id: true, name: true, code: true } },
          course: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getEventById(id: string) {
    const event = await prisma.institutionalEvent.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            adminProfile: { select: { firstName: true, lastName: true } },
          },
        },
        department: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true, code: true } },
      },
    });

    if (!event) throw ApiError.notFound('Institutional event not found');
    return event;
  },

  async updateEvent(
    actorUserId: string,
    id: string,
    data: UpdateInstitutionalEventInput,
    ipAddress?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.institutionalEvent.findUnique({ where: { id } });
      if (!existing) throw ApiError.notFound('Institutional event not found');

      const targetStartDate = data.startDate ? new Date(data.startDate) : existing.startDate;
      const targetEndDate =
        data.endDate !== undefined
          ? data.endDate
            ? new Date(data.endDate)
            : null
          : existing.endDate;

      if (targetEndDate && targetEndDate < targetStartDate) {
        throw ApiError.badRequest('endDate must not be before startDate');
      }

      const effectiveScope = data.targetScope || existing.targetScope;
      let effectiveDeptId = data.departmentId !== undefined ? data.departmentId : existing.departmentId;
      let effectiveCourseId = data.courseId !== undefined ? data.courseId : existing.courseId;

      if (data.targetScope && data.targetScope !== existing.targetScope) {
        if (data.targetScope === 'ALL') {
          effectiveDeptId = null;
          effectiveCourseId = null;
        } else if (data.targetScope === 'DEPARTMENT') {
          effectiveCourseId = null;
        } else if (data.targetScope === 'COURSE') {
          effectiveDeptId = null;
        }
      }

      const scopeData = await resolveScopeTargeting(
        effectiveScope,
        effectiveDeptId,
        effectiveCourseId
      );

      const updated = await tx.institutionalEvent.update({
        where: { id },
        data: {
          ...(data.title ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.category ? { category: data.category } : {}),
          startDate: targetStartDate,
          endDate: targetEndDate,
          ...(data.location !== undefined ? { location: data.location } : {}),
          ...(data.targetScope ? { targetScope: data.targetScope } : {}),
          departmentId: scopeData.departmentId,
          courseId: scopeData.courseId,
          ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
        },
        include: {
          department: { select: { id: true, name: true, code: true } },
          course: { select: { id: true, name: true, code: true } },
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: CONTENT_AUDIT_ACTIONS.INSTITUTIONAL_EVENT_UPDATED,
          targetType: 'InstitutionalEvent',
          targetId: id,
          details: { previous: existing, updated: data },
          ipAddress: ipAddress ?? null,
        },
      });

      return updated;
    });
  },

  async deleteEvent(actorUserId: string, id: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.institutionalEvent.findUnique({ where: { id } });
      if (!existing) throw ApiError.notFound('Institutional event not found');

      const deleted = await tx.institutionalEvent.delete({ where: { id } });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: CONTENT_AUDIT_ACTIONS.INSTITUTIONAL_EVENT_DELETED,
          targetType: 'InstitutionalEvent',
          targetId: id,
          details: { title: existing.title, category: existing.category },
          ipAddress: ipAddress ?? null,
        },
      });

      return deleted;
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 3. ACADEMIC RESOURCES
  // ───────────────────────────────────────────────────────────────────────────

  async createResource(
    actorUserId: string,
    data: CreateAcademicResourceInput,
    ipAddress?: string
  ) {
    const scopeData = await resolveResourceTargeting(data.departmentId, data.courseId);

    return prisma.$transaction(async (tx) => {
      const resource = await tx.academicResource.create({
        data: {
          title: data.title,
          description: data.description ?? null,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          category: data.category || 'SYLLABUS',
          departmentId: scopeData.departmentId,
          courseId: scopeData.courseId,
          uploadedByUserId: actorUserId,
        },
        include: {
          department: { select: { id: true, name: true, code: true } },
          course: { select: { id: true, name: true, code: true } },
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: CONTENT_AUDIT_ACTIONS.ACADEMIC_RESOURCE_CREATED,
          targetType: 'AcademicResource',
          targetId: resource.id,
          details: { title: resource.title, category: resource.category, fileUrl: resource.fileUrl },
          ipAddress: ipAddress ?? null,
        },
      });

      return resource;
    });
  },

  async listResources(query: ListAcademicResourcesQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AcademicResourceWhereInput = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.academicResource.count({ where }),
      prisma.academicResource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedByUser: {
            select: {
              id: true,
              email: true,
              adminProfile: { select: { firstName: true, lastName: true } },
            },
          },
          department: { select: { id: true, name: true, code: true } },
          course: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getResourceById(id: string) {
    const resource = await prisma.academicResource.findUnique({
      where: { id },
      include: {
        uploadedByUser: {
          select: {
            id: true,
            email: true,
            adminProfile: { select: { firstName: true, lastName: true } },
          },
        },
        department: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true, code: true } },
      },
    });

    if (!resource) throw ApiError.notFound('Academic resource not found');
    return resource;
  },

  async updateResource(
    actorUserId: string,
    id: string,
    data: UpdateAcademicResourceInput,
    ipAddress?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.academicResource.findUnique({ where: { id } });
      if (!existing) throw ApiError.notFound('Academic resource not found');

      const effectiveDeptId = data.departmentId !== undefined ? data.departmentId : existing.departmentId;
      const effectiveCourseId = data.courseId !== undefined ? data.courseId : existing.courseId;

      const scopeData = await resolveResourceTargeting(effectiveDeptId, effectiveCourseId);

      const updated = await tx.academicResource.update({
        where: { id },
        data: {
          ...(data.title ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.fileUrl ? { fileUrl: data.fileUrl } : {}),
          ...(data.fileType ? { fileType: data.fileType } : {}),
          ...(data.category ? { category: data.category } : {}),
          departmentId: scopeData.departmentId,
          courseId: scopeData.courseId,
        },
        include: {
          department: { select: { id: true, name: true, code: true } },
          course: { select: { id: true, name: true, code: true } },
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: CONTENT_AUDIT_ACTIONS.ACADEMIC_RESOURCE_UPDATED,
          targetType: 'AcademicResource',
          targetId: id,
          details: { previous: existing, updated: data },
          ipAddress: ipAddress ?? null,
        },
      });

      return updated;
    });
  },

  async deleteResource(actorUserId: string, id: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.academicResource.findUnique({ where: { id } });
      if (!existing) throw ApiError.notFound('Academic resource not found');

      const deleted = await tx.academicResource.delete({ where: { id } });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: CONTENT_AUDIT_ACTIONS.ACADEMIC_RESOURCE_DELETED,
          targetType: 'AcademicResource',
          targetId: id,
          details: { title: existing.title, fileUrl: existing.fileUrl },
          ipAddress: ipAddress ?? null,
        },
      });

      return deleted;
    });
  },
};
