import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

// ─────────────────────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random URL-safe token.
 * Returns [rawToken, hashedToken] — store only the hash, send the raw token to the user.
 */
function generateSecureToken(): [string, string] {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return [raw, hashed];
}

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─────────────────────────────────────────────────────────────
// Development-mode "email" transport
// In production, swap this for a real email provider (Resend, SES, etc.)
// ─────────────────────────────────────────────────────────────
function sendDevelopmentEmail(to: string, subject: string, body: string) {
  console.log('\n📧 [DEV EMAIL]');
  console.log(`  To: ${to}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Body:\n  ${body}`);
  console.log('─'.repeat(60));
}

// ─────────────────────────────────────────────────────────────
// Auth Service
// ─────────────────────────────────────────────────────────────

export const authService = {
  async register(data: any) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict('Email is already registered');
    }

    const hashedPassword = await hashPassword(data.password);

    // Generate email verification token upfront
    const [rawVerificationToken, hashedVerificationToken] = generateSecureToken();
    const verificationExpires = new Date(Date.now() + TOKEN_TTL_MS);

    return prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          role: 'STUDENT',
          verificationTokenHash: hashedVerificationToken,
          verificationExpires,
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

      // 3. Create initial default Semester
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

      // 4. Create StudentSettings
      await tx.studentSettings.create({
        data: {
          userId: user.id,
          defaultSemesterId: semester.id,
        },
      });

      // 5. Create StudentAnalytics
      await tx.studentAnalytics.create({
        data: { studentProfileId: profile.id },
      });

      // Send verification email (dev: logs to console)
      sendDevelopmentEmail(
        user.email,
        'Verify your Integrum account',
        `Your verification token is: ${rawVerificationToken}\n\nUse POST /api/v1/auth/verify-email with this token.\nExpires in 1 hour.`
      );

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

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists');
    }
    if (!user.isActive) {
      throw ApiError.forbidden('User account is inactive');
    }

    const newPayload = { sub: user.id, email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(_userId: string) {
    return { success: true };
  },

  // ─────────────────────────────────────────────────────────────
  // I-1: Forgot Password
  // ─────────────────────────────────────────────────────────────

  async forgotPassword(email: string) {
    // Always return the same generic response — prevents account enumeration
    const genericMessage = 'If an account with that email exists, password-reset instructions have been sent.';

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      // Return generic message even if user not found
      return { message: genericMessage };
    }

    const [rawToken, hashedToken] = generateSecureToken();
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: hashedToken,
        passwordResetExpires: expires,
      },
    });

    sendDevelopmentEmail(
      email,
      'Reset your Integrum password',
      `Your password-reset token is: ${rawToken}\n\nUse POST /api/v1/auth/reset-password with this token.\nExpires in 1 hour. This token is single-use.`
    );

    return { message: genericMessage };
  },

  // ─────────────────────────────────────────────────────────────
  // I-1: Reset Password
  // ─────────────────────────────────────────────────────────────

  async resetPassword(rawToken: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetTokenHash: hashedToken,
        passwordResetExpires: { gt: new Date() }, // not expired
      },
    });

    if (!user) {
      throw ApiError.badRequest('Password reset token is invalid or has expired');
    }

    const hashedPassword = await hashPassword(newPassword);

    // Update password and invalidate the token (one-time use)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password has been reset successfully. Please log in.' };
  },

  // ─────────────────────────────────────────────────────────────
  // I-2: Email Verification
  // ─────────────────────────────────────────────────────────────

  async verifyEmail(rawToken: string) {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        verificationTokenHash: hashedToken,
        verificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw ApiError.badRequest('Verification token is invalid or has expired');
    }

    if (user.isVerified) {
      // Already verified — safe no-op
      return { message: 'Email is already verified' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationTokenHash: null,
        verificationExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  },

  async resendVerificationEmail(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw ApiError.notFound('User not found');
    if (user.isVerified) {
      return { message: 'Email is already verified' };
    }

    const [rawToken, hashedToken] = generateSecureToken();
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationTokenHash: hashedToken,
        verificationExpires: expires,
      },
    });

    sendDevelopmentEmail(
      user.email,
      'Verify your Integrum account',
      `Your new verification token is: ${rawToken}\n\nUse POST /api/v1/auth/verify-email with this token.\nExpires in 1 hour.`
    );

    return { message: 'Verification email resent' };
  },
};
