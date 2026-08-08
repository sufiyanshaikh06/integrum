import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword } from '../utils/password.js';

export const authService = {
  async register(data: any) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict('Email is already registered');
    }

    const hashedPassword = await hashPassword(data.password);

    return prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          role: 'STUDENT',
        },
      });

      // 2. Create StudentProfile
      const profile = await tx.studentProfile.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });

      // 3. Create Semester (initial default semester)
      const now = new Date();
      const semesterEnd = new Date();
      semesterEnd.setMonth(now.getMonth() + 4);

      const semester = await tx.semester.create({
        data: {
          studentProfileId: profile.id,
          name: 'Semester 1',
          startDate: now,
          endDate: semesterEnd,
        },
      });

      // 4. Create StudentSettings (linked to default semester)
      await tx.studentSettings.create({
        data: {
          userId: user.id,
          defaultSemesterId: semester.id,
        },
      });

      // 5. Create StudentAnalytics
      await tx.studentAnalytics.create({
        data: {
          studentProfileId: profile.id,
        },
      });

      // Return clean user object
      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    });
  },
};
