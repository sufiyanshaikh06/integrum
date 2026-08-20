import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

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
            university: true,
            enrollmentYear: true,
            graduationYear: true,
            careerGoals: true,
            socialLinks: true,
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
};
