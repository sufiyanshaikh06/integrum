import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  ListStudentsQuery,
  ListAdminsQuery,
  CreateAdminInput,
  UpdateUserStatusInput,
  UpdateUserRoleInput,
} from '../../schemas/admin/user.schema.js';

/**
 * Shared helper that provisions mandatory student baseline records identically
 * for normal registration and for ADMIN -> STUDENT role demotions.
 */
export async function ensureStudentBaseline(
  tx: Prisma.TransactionClient,
  user: { id: string; email: string },
  nameData?: { firstName?: string | undefined; lastName?: string | undefined }
) {
  let profile = await tx.studentProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    profile = await tx.studentProfile.create({
      data: {
        userId: user.id,
        firstName: nameData?.firstName || 'Student',
        lastName: nameData?.lastName || 'User',
      },
    });
  }

  // 1. Ensure default semester exists
  let semester = await tx.semester.findFirst({ where: { studentProfileId: profile.id } });
  if (!semester) {
    const now = new Date();
    const semesterEnd = new Date();
    semesterEnd.setMonth(now.getMonth() + 4);
    semester = await tx.semester.create({
      data: {
        studentProfileId: profile.id,
        name: 'Semester 1',
        startDate: now,
        endDate: semesterEnd,
      },
    });
  }

  // 2. Ensure StudentSettings exists
  const settings = await tx.studentSettings.findUnique({ where: { userId: user.id } });
  if (!settings) {
    await tx.studentSettings.create({
      data: { userId: user.id, defaultSemesterId: semester.id },
    });
  }

  // 3. Ensure StudentAnalytics exists
  const analytics = await tx.studentAnalytics.findUnique({
    where: { studentProfileId: profile.id },
  });
  if (!analytics) {
    await tx.studentAnalytics.create({ data: { studentProfileId: profile.id } });
  }

  return profile;
}

export const adminUserService = {
  /**
   * List student accounts with search, filters and pagination.
   * Explicitly excludes sensitive password and token hashes.
   */
  async listStudents(query: ListStudentsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const isActiveFilter =
      query.isActive === true || (query.isActive as any) === 'true'
        ? true
        : query.isActive === false || (query.isActive as any) === 'false'
        ? false
        : undefined;

    const isVerifiedFilter =
      query.isVerified === true || (query.isVerified as any) === 'true'
        ? true
        : query.isVerified === false || (query.isVerified as any) === 'false'
        ? false
        : undefined;

    const where: Prisma.UserWhereInput = {
      role: 'STUDENT',
      ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
      ...(isVerifiedFilter !== undefined ? { isVerified: isVerifiedFilter } : {}),
      ...(query.courseId
        ? { studentProfile: { courseId: query.courseId } }
        : {}),
    };

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { studentProfile: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { studentProfile: { lastName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          studentProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              university: true,
              enrollmentYear: true,
              graduationYear: true,
              courseId: true,
              course: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  department: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * List administrator accounts with search, department filtering, and pagination.
   */
  async listAdmins(query: ListAdminsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: 'ADMIN',
      ...(query.departmentId
        ? { adminProfile: { departmentId: query.departmentId } }
        : {}),
    };

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { adminProfile: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { adminProfile: { lastName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, admins] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          adminProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              permissionsLevel: true,
              departmentId: true,
              departmentRef: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: admins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Direct Administrator Provisioning.
   * Atomically creates User (ADMIN) + AdminProfile + AdminAuditLog.
   */
  async createAdmin(actorUserId: string, data: CreateAdminInput, ipAddress?: string) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    if (data.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });
      if (!dept) {
        throw ApiError.badRequest('Referenced department does not exist');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return prisma.$transaction(async (tx) => {
      const newAdmin = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: 'ADMIN',
          isVerified: true,
          isActive: true,
          adminProfile: {
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
              permissionsLevel: data.permissionsLevel || 1,
              departmentId: data.departmentId ?? null,
            },
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          adminProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              permissionsLevel: true,
              departmentId: true,
            },
          },
        },
      });

      // Atomic Audit Record
      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: 'ADMIN_ACCOUNT_CREATED',
          targetType: 'User',
          targetId: newAdmin.id,
          details: {
            email: data.email,
            permissionsLevel: data.permissionsLevel || 1,
            departmentId: data.departmentId ?? null,
          },
          ipAddress: ipAddress ?? null,
        },
      });

      return newAdmin;
    });
  },

  /**
   * Account Status Toggle with safety guards and atomic audit logging.
   */
  async updateUserStatus(
    actorUserId: string,
    targetUserId: string,
    data: UpdateUserStatusInput,
    ipAddress?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!targetUser) {
        throw ApiError.notFound('User not found');
      }

      // Safety guard 1: Cannot deactivate own account
      if (actorUserId === targetUserId && !data.isActive) {
        throw ApiError.badRequest('You cannot deactivate your own administrator account');
      }

      // Safety guard 2: Cannot deactivate the last active admin
      if (targetUser.role === 'ADMIN' && !data.isActive) {
        const otherActiveAdmins = await tx.user.count({
          where: {
            role: 'ADMIN',
            isActive: true,
            NOT: { id: targetUserId },
          },
        });

        if (otherActiveAdmins === 0) {
          throw ApiError.badRequest('Cannot deactivate the last active administrator in the system');
        }
      }

      if (targetUser.isActive === data.isActive) {
        return targetUser;
      }

      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: { isActive: data.isActive },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          updatedAt: true,
        },
      });

      // Atomic Audit Record
      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: 'USER_STATUS_TOGGLED',
          targetType: 'User',
          targetId: targetUserId,
          details: {
            email: targetUser.email,
            previousStatus: targetUser.isActive,
            newStatus: data.isActive,
            role: targetUser.role,
          },
          ipAddress: ipAddress ?? null,
        },
      });

      return updated;
    });
  },

  /**
   * Profile-Aware Role Management.
   * Atomically transitions roles, provisions required baselines, preserves historical
   * records, enforces last-admin guard, and emits audit log.
   */
  async updateUserRole(
    actorUserId: string,
    targetUserId: string,
    data: UpdateUserRoleInput,
    ipAddress?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: targetUserId },
        include: {
          studentProfile: true,
          adminProfile: true,
        },
      });

      if (!targetUser) {
        throw ApiError.notFound('User not found');
      }

      // Safety guard 1: Cannot change own role
      if (actorUserId === targetUserId) {
        throw ApiError.badRequest('You cannot modify your own administrator role');
      }

      // If already at target role, return without modifications
      if (targetUser.role === data.role) {
        return {
          id: targetUser.id,
          email: targetUser.email,
          role: targetUser.role,
          isActive: targetUser.isActive,
        };
      }

      // ─── PROMOTION: STUDENT -> ADMIN ─────────────────────────────
      if (data.role === 'ADMIN') {
        await tx.user.update({
          where: { id: targetUserId },
          data: { role: 'ADMIN' },
        });

        if (targetUser.adminProfile) {
          await tx.adminProfile.update({
            where: { id: targetUser.adminProfile.id },
            data: {
              permissionsLevel: data.permissionsLevel || targetUser.adminProfile.permissionsLevel,
              departmentId: data.departmentId !== undefined ? data.departmentId : targetUser.adminProfile.departmentId,
            },
          });
        } else {
          await tx.adminProfile.create({
            data: {
              userId: targetUserId,
              firstName: targetUser.studentProfile?.firstName || 'Admin',
              lastName: targetUser.studentProfile?.lastName || 'User',
              permissionsLevel: data.permissionsLevel || 1,
              departmentId: data.departmentId ?? null,
            },
          });
        }

        // Atomic Audit Record
        await tx.adminAuditLog.create({
          data: {
            actorUserId,
            action: 'USER_ROLE_PROMOTED',
            targetType: 'User',
            targetId: targetUserId,
            details: {
              email: targetUser.email,
              previousRole: 'STUDENT',
              newRole: 'ADMIN',
              permissionsLevel: data.permissionsLevel || 1,
            },
            ipAddress: ipAddress ?? null,
          },
        });
      }

      // ─── DEMOTION: ADMIN -> STUDENT ──────────────────────────────
      if (data.role === 'STUDENT') {
        // Safety guard 2: Cannot demote the last active admin
        const otherActiveAdmins = await tx.user.count({
          where: {
            role: 'ADMIN',
            isActive: true,
            NOT: { id: targetUserId },
          },
        });

        if (otherActiveAdmins === 0) {
          throw ApiError.badRequest('Cannot demote the last active administrator in the system');
        }

        await tx.user.update({
          where: { id: targetUserId },
          data: { role: 'STUDENT' },
        });

        // Ensure full mandatory student baseline exists
        await ensureStudentBaseline(tx, targetUser, {
          firstName: targetUser.adminProfile?.firstName,
          lastName: targetUser.adminProfile?.lastName,
        });

        // Atomic Audit Record
        await tx.adminAuditLog.create({
          data: {
            actorUserId,
            action: 'USER_ROLE_DEMOTED',
            targetType: 'User',
            targetId: targetUserId,
            details: {
              email: targetUser.email,
              previousRole: 'ADMIN',
              newRole: 'STUDENT',
            },
            ipAddress: ipAddress ?? null,
          },
        });
      }

      const refreshed = await tx.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          studentProfile: {
            select: { id: true, firstName: true, lastName: true, courseId: true },
          },
          adminProfile: {
            select: { id: true, firstName: true, lastName: true, permissionsLevel: true, departmentId: true },
          },
        },
      });

      return refreshed!;
    });
  },
};
