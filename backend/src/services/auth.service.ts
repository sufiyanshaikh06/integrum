import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

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

  async login(data: any) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('User account is inactive');
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    // We already handle JWT verification in the controller or via verifyRefreshToken
    // but the service should verify against the database
    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('User account is inactive');
    }

    const newPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(userId: string) {
    // For V1, we just return success since we clear the cookie in the controller.
    // Future: invalidate refresh token in the database.
    return { success: true };
  },
};

