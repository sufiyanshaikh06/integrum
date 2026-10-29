import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  assignmentReminders: true,
  examReminders: true,
  interviewReminders: true,
  certificationReminders: true,
  systemAnnouncements: true,
  emailNotifications: true,
} as const;

export const userService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
            rollNumber: true,
            isIndependent: true,
            institutionId: true,
            departmentId: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                institution: { select: { id: true, name: true, code: true } },
              },
            },
            university: true,
            courseId: true,
            course: { select: { id: true, name: true, code: true, department: { select: { id: true, name: true, code: true } } } },
            enrollmentYear: true,
            graduationYear: true,
            careerGoals: true,
            socialLinks: true,
            uploadedResumeFileId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        settings: {
          select: {
            notificationPreferences: true,
            defaultSemesterId: true,
          },
        },
      },
    });

    if (!user) throw ApiError.notFound('User profile not found');
    if (user.settings) {
      const prefs = (user.settings.notificationPreferences as Record<string, boolean> | null) ?? {};
      user.settings.notificationPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...prefs,
      };
    }
    return user;
  },

  // I-3: Update Profile
  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    university?: string;
    enrollmentYear?: number;
    graduationYear?: number;
    careerGoals?: string;
    socialLinks?: object;
  }) {
    // Find the StudentProfile linked to this user
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) throw ApiError.notFound('Student profile not found');

    const updateData: Record<string, any> = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.university !== undefined) updateData.university = data.university;
    if (data.enrollmentYear !== undefined) updateData.enrollmentYear = data.enrollmentYear;
    if (data.graduationYear !== undefined) updateData.graduationYear = data.graduationYear;
    if (data.careerGoals !== undefined) updateData.careerGoals = data.careerGoals;
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;

    const updated = await prisma.studentProfile.update({
      where: { userId },
      data: updateData,
    });

    return updated;
  },

  // G2: Attach resume file to student profile
  async attachResume(userId: string, fileId: string, expectedFileId: string | null) {
    const result = await prisma.studentProfile.updateMany({
      where: { userId, uploadedResumeFileId: expectedFileId },
      data: { uploadedResumeFileId: fileId, resumeStorageProvider: env.STORAGE_PROVIDER },
    });
    if (result.count !== 1) throw ApiError.conflict('Profile changed during upload; retry');
  },

  // G2: Get resume attachment and recorded provider for student profile
  async getResumeAttachment(userId: string): Promise<{ fileId: string; provider: string | null }> {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { uploadedResumeFileId: true, resumeStorageProvider: true },
    });
    if (!profile?.uploadedResumeFileId) {
      throw ApiError.notFound('No resume file uploaded');
    }
    return { fileId: profile.uploadedResumeFileId, provider: profile.resumeStorageProvider };
  },

  // G2: Get resume fileId for student profile
  async getResumeFileId(userId: string): Promise<string> {
    const attachment = await this.getResumeAttachment(userId);
    return attachment.fileId;
  },

  // W19: Student settings
  async getSettings(userId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw ApiError.notFound('Student profile not found');

    let settings = await prisma.studentSettings.findUnique({
      where: { userId },
      include: {
        defaultSemester: {
          select: { id: true, name: true, startDate: true, endDate: true },
        },
      },
    });

    if (!settings) {
      settings = await prisma.studentSettings.create({
        data: {
          userId,
          notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
        },
        include: {
          defaultSemester: {
            select: { id: true, name: true, startDate: true, endDate: true },
          },
        },
      });
    }

    const currentPrefs = (settings.notificationPreferences as Record<string, boolean> | null) ?? {};
    const resolvedPrefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...currentPrefs,
    };

    return {
      id: settings.id,
      userId: settings.userId,
      notificationPreferences: resolvedPrefs,
      defaultSemesterId: settings.defaultSemesterId,
      defaultSemester: settings.defaultSemester,
    };
  },

  async updateSettings(userId: string, data: {
    notificationPreferences?: Partial<typeof DEFAULT_NOTIFICATION_PREFERENCES>;
    defaultSemesterId?: string | null;
  }) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw ApiError.notFound('Student profile not found');

    if (data.defaultSemesterId !== undefined && data.defaultSemesterId !== null) {
      const semester = await prisma.semester.findFirst({
        where: {
          id: data.defaultSemesterId,
          studentProfileId: profile.id,
        },
        select: { id: true },
      });
      if (!semester) {
        throw ApiError.notFound('Semester not found or does not belong to you');
      }
    }

    const existingSettings = await prisma.studentSettings.findUnique({
      where: { userId },
    });
    const existingPrefs = (existingSettings?.notificationPreferences as Record<string, boolean> | null) ?? DEFAULT_NOTIFICATION_PREFERENCES;
    const mergedPrefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...existingPrefs,
      ...(data.notificationPreferences ?? {}),
    };

    const updated = await prisma.studentSettings.upsert({
      where: { userId },
      create: {
        userId,
        notificationPreferences: mergedPrefs,
        ...(data.defaultSemesterId !== undefined ? { defaultSemesterId: data.defaultSemesterId } : {}),
      },
      update: {
        ...(data.notificationPreferences !== undefined ? { notificationPreferences: mergedPrefs } : {}),
        ...(data.defaultSemesterId !== undefined ? { defaultSemesterId: data.defaultSemesterId } : {}),
      },
      include: {
        defaultSemester: {
          select: { id: true, name: true, startDate: true, endDate: true },
        },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      notificationPreferences: updated.notificationPreferences,
      defaultSemesterId: updated.defaultSemesterId,
      defaultSemester: updated.defaultSemester,
    };
  },
};

