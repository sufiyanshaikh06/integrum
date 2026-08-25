// @ts-nocheck
import { z } from 'zod';

// ─── SYSTEM SETTING ENUM & SCHEMAS ──────────────────────────────────────────

export const ALLOWED_SETTING_KEYS = [
  'MAINTENANCE_MODE',
  'ALLOW_STUDENT_REGISTRATION',
  'AI_FEATURES_ENABLED',
] as const;

export const updateSystemSettingSchema = z.object({
  body: z.object({
    value: z.boolean({ invalid_type_error: 'Boolean value required' }),
    description: z.string().optional(),
  }),
});

// ─── FEEDBACK SCHEMAS ───────────────────────────────────────────────────────

export const submitFeedbackSchema = z.object({
  body: z.object({
    category: z.enum(['', '', '', ''] as [string, ...string[]], {
      errorMap: () => ({ message: 'Invalid feedback category' }),
    }),
    subject: z.string().trim().min(1, 'Subject is required'),
    message: z.string().trim().min(1, 'Message is required'),
  }),
});

export const updateFeedbackAdminSchema = z.object({
  body: z.object({
    status: z.enum(['', '', '', ''] as [string, ...string[]], {
      errorMap: () => ({ message: 'Invalid feedback status' }),
    }),
    adminNotes: z.string().trim().optional().nullable(),
  }),
});

export const listFeedbackQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['', '', '', ''] as [string, ...string[]]).optional(),
    category: z.enum(['', '', '', ''] as [string, ...string[]]).optional(),
    studentProfileId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    search: z.string().trim().optional(),
  }),
});

// ─── AUDIT LOG QUERY SCHEMA ─────────────────────────────────────────────────

export const listAuditLogsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    action: z.string().trim().optional(),
    actorUserId: z.string().uuid().optional(),
    targetType: z.string().trim().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    search: z.string().trim().optional(),
  }),
});

// ─── TYPE INFERENCES ────────────────────────────────────────────────────────

export type UpdateSystemSettingInput = z.infer<typeof updateSystemSettingSchema>['body'];
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>['body'];
export type UpdateFeedbackAdminInput = z.infer<typeof updateFeedbackAdminSchema>['body'];
export type ListFeedbackQuery = z.infer<typeof listFeedbackQuerySchema>['query'];
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>['query'];
