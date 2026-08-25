import { Prisma, SystemSettingKey, FeedbackStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { auditService } from './audit.service.js';
import {
  ListFeedbackQuery,
  UpdateFeedbackAdminInput,
  UpdateSystemSettingInput,
  ALLOWED_SETTING_KEYS,
} from '../../schemas/admin/platform.schema.js';

// Baseline fallback defaults in case a database row is missing
const SETTING_FALLBACK_DEFAULTS: Record<SystemSettingKey, boolean> = {
  MAINTENANCE_MODE: false,
  ALLOW_STUDENT_REGISTRATION: true,
  AI_FEATURES_ENABLED: true,
};

export const adminPlatformService = {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. ADMIN DASHBOARD AGGREGATIONS
  // ───────────────────────────────────────────────────────────────────────────

  async getDashboardMetrics() {
    const [
      // Users
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalStudents,
      totalAdmins,

      // Academics
      totalDepartments,
      totalCourses,
      totalMasterSubjects,
      totalStudentSubjects,

      // Career
      totalApplications,
      interviewingApplications,
      offeredApplications,
      rejectedApplications,

      // AI
      totalAiExecutions,
      successfulAiExecutions,
      failedAiExecutions,

      // Feedback
      pendingFeedback,
      underReviewFeedback,
      resolvedFeedback,
      dismissedFeedback,

      // Content
      publishedAnnouncements,
      totalNotices,
      totalEvents,
      totalResources,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),

      // Academics
      prisma.department.count(),
      prisma.course.count(),
      prisma.masterSubject.count(),
      prisma.subject.count(),

      // Career
      prisma.jobApplication.count(),
      prisma.jobApplication.count({ where: { status: 'INTERVIEWING' } }),
      prisma.jobApplication.count({ where: { status: 'OFFERED' } }),
      prisma.jobApplication.count({ where: { status: 'REJECTED' } }),

      // AI
      prisma.aIExecutionLog.count(),
      prisma.aIExecutionLog.count({ where: { status: 'SUCCESS' } }),
      prisma.aIExecutionLog.count({ where: { status: 'FAILED' } }),

      // Feedback
      prisma.feedback.count({ where: { status: 'PENDING' } }),
      prisma.feedback.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.feedback.count({ where: { status: 'RESOLVED' } }),
      prisma.feedback.count({ where: { status: 'DISMISSED' } }),

      // Content
      prisma.announcement.count({ where: { isPublished: true, type: 'ANNOUNCEMENT' } }),
      prisma.announcement.count({ where: { type: 'NOTICE' } }),
      prisma.institutionalEvent.count(),
      prisma.academicResource.count(),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        students: totalStudents,
        admins: totalAdmins,
      },
      academics: {
        departments: totalDepartments,
        courses: totalCourses,
        masterSubjects: totalMasterSubjects,
        studentSubjects: totalStudentSubjects,
      },
      career: {
        totalApplications,
        interviewing: interviewingApplications,
        offered: offeredApplications,
        rejected: rejectedApplications,
      },
      ai: {
        totalExecutions: totalAiExecutions,
        successful: successfulAiExecutions,
        failed: failedAiExecutions,
      },
      feedback: {
        pending: pendingFeedback,
        underReview: underReviewFeedback,
        resolved: resolvedFeedback,
        dismissed: dismissedFeedback,
      },
      content: {
        publishedAnnouncements,
        notices: totalNotices,
        institutionalEvents: totalEvents,
        resources: totalResources,
      },
      generatedAt: new Date().toISOString(),
    };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 2. ADMIN FEEDBACK MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  async listFeedback(query: ListFeedbackQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.FeedbackWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.studentProfileId ? { studentProfileId: query.studentProfileId } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
        { adminNotes: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.feedback.count({ where }),
      prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          studentProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              user: { select: { email: true } },
            },
          },
          resolvedByUser: {
            select: {
              id: true,
              email: true,
              adminProfile: { select: { firstName: true, lastName: true } },
            },
          },
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

  async getFeedbackById(id: string) {
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        studentProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: { select: { email: true } },
          },
        },
        resolvedByUser: {
          select: {
            id: true,
            email: true,
            adminProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!feedback) throw ApiError.notFound('Feedback record not found');
    return feedback;
  },

  async updateFeedback(
    actorUserId: string,
    id: string,
    data: UpdateFeedbackAdminInput,
    ipAddress?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.feedback.findUnique({ where: { id } });
      if (!existing) throw ApiError.notFound('Feedback record not found');

      // State Invariant: resolvedAt and resolvedByUserId are only set when status is RESOLVED
      const isResolved = data.status === 'RESOLVED';
      const resolvedByUserId = isResolved ? actorUserId : null;
      const resolvedAt = isResolved ? new Date() : null;

      const updated = await tx.feedback.update({
        where: { id },
        data: {
          status: data.status,
          adminNotes: data.adminNotes !== undefined ? data.adminNotes : existing.adminNotes,
          resolvedByUserId,
          resolvedAt,
        },
        include: {
          studentProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              user: { select: { email: true } },
            },
          },
          resolvedByUser: {
            select: {
              id: true,
              email: true,
              adminProfile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      await auditService.createAuditLog(tx, {
        actorUserId,
        action: `FEEDBACK_${data.status}`,
        targetType: 'Feedback',
        targetId: id,
        details: {
          previousStatus: existing.status,
          newStatus: data.status,
          adminNotes: data.adminNotes,
        },
        ipAddress,
      });

      return updated;
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 3. SYSTEM SETTINGS MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  async getSettings() {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
      include: {
        updatedByUser: {
          select: {
            id: true,
            email: true,
            adminProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return settings;
  },

  async getSettingValue(key: SystemSettingKey): Promise<boolean> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return SETTING_FALLBACK_DEFAULTS[key] ?? true;
    }

    if (typeof setting.value === 'boolean') {
      return setting.value;
    }
    if (typeof setting.value === 'string') {
      return setting.value === 'true';
    }
    return Boolean(setting.value);
  },

  async updateSetting(
    actorUserId: string,
    rawKey: string,
    data: UpdateSystemSettingInput,
    ipAddress?: string
  ) {
    if (!ALLOWED_SETTING_KEYS.includes(rawKey as any)) {
      throw ApiError.badRequest(
        `Invalid or unsupported setting key "${rawKey}". Supported keys are: ${ALLOWED_SETTING_KEYS.join(', ')}`
      );
    }

    const key = rawKey as SystemSettingKey;

    return prisma.$transaction(async (tx) => {
      const previous = await tx.systemSetting.findUnique({ where: { key } });

      const updated = await tx.systemSetting.upsert({
        where: { key },
        create: {
          key,
          value: data.value,
          description: data.description || `${key} configuration`,
          updatedByUserId: actorUserId,
        },
        update: {
          value: data.value,
          ...(data.description ? { description: data.description } : {}),
          updatedByUserId: actorUserId,
        },
        include: {
          updatedByUser: {
            select: {
              id: true,
              email: true,
              adminProfile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      await auditService.createAuditLog(tx, {
        actorUserId,
        action: 'SYSTEM_SETTING_UPDATED',
        targetType: 'SystemSetting',
        targetId: updated.id,
        details: {
          key,
          previousValue: previous?.value,
          newValue: data.value,
        },
        ipAddress,
      });

      return updated;
    });
  },
};
