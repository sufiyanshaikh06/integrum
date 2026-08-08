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
            firstName: true,
            lastName: true,
            university: true,
            enrollmentYear: true,
            graduationYear: true,
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

    if (!user) {
      throw ApiError.notFound('User profile not found');
    }

    return user;
  },
};
