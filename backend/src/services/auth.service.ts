import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { ensureStudentBaseline } from './admin/user.service.js';
import { adminPlatformService } from './admin/platform.service.js';
import { emailService } from './email.service.js';

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
// Auth Service
// ─────────────────────────────────────────────────────────────

export const authService = {
  async register(data: any) {
    const allowRegistration = await adminPlatformService.getSettingValue('ALLOW_STUDENT_REGISTRATION');
    if (!allowRegistration) {
      throw ApiError.forbidden('Student registration is currently disabled by administrator');
    }

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

      // 2. Create mandatory student baseline records via centralized helper
      await ensureStudentBaseline(tx, user, {
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Send verification email
      await emailService.send(
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

    const sid = crypto.randomUUID();
    const payload = { sub: user.id, email: user.email, role: user.role, sid, version: user.authVersion };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await prisma.$transaction(async tx => {
      // Serialize login issuance with reset/revocation on the user row.
      const locked = await tx.user.updateMany({
        where: { id: user.id, passwordHash: user.passwordHash, authVersion: user.authVersion, isActive: true },
        data: { lastLoginAt: new Date() },
      });
      if (locked.count !== 1) throw ApiError.unauthorized('Account changed; please log in again');
      await tx.authSession.create({ data: { id: sid, userId: user.id,
        refreshHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
        expiresAt: new Date(verifyRefreshToken(refreshToken).exp! * 1000) } });
    });

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
    let payload: ReturnType<typeof verifyRefreshToken>;
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

    if (payload.version !== user.authVersion) throw ApiError.unauthorized('Session revoked');
    const newPayload = { sub: user.id, email: user.email, role: user.role, sid: payload.sid!, version: user.authVersion };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    const rotated = await prisma.authSession.updateMany({
      where: { id: payload.sid!, userId: user.id,
        refreshHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
        expiresAt: { gt: new Date() } },
      data: { refreshHash: crypto.createHash('sha256').update(newRefreshToken).digest('hex'),
        expiresAt: new Date(verifyRefreshToken(newRefreshToken).exp! * 1000) },
    });
    if (rotated.count !== 1) throw ApiError.unauthorized('Refresh token already used or session revoked');
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(userId: string, sessionId: string) {
    await prisma.authSession.deleteMany({ where: { id: sessionId, userId } });
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

    await emailService.send(
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

    await prisma.$transaction(async tx => {
      const updated = await tx.user.updateMany({
        where: { id: user.id, passwordResetTokenHash: hashedToken, passwordResetExpires: { gt: new Date() } },
        data: { passwordHash: hashedPassword, passwordResetTokenHash: null,
          passwordResetExpires: null, authVersion: { increment: 1 } },
      });
      if (updated.count !== 1) throw ApiError.badRequest('Password reset token is invalid or has expired');
      await tx.authSession.deleteMany({ where: { userId: user.id } });
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

    await emailService.send(
      user.email,
      'Verify your Integrum account',
      `Your new verification token is: ${rawToken}\n\nUse POST /api/v1/auth/verify-email with this token.\nExpires in 1 hour.`
    );

    return { message: 'Verification email resent' };
  },
};
