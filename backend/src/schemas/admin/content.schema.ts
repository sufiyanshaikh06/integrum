// @ts-nocheck
import { z } from 'zod';

// ─── ANNOUNCEMENT / NOTICE SCHEMAS ──────────────────────────────────────────

const baseAnnouncementBody = z.object({
  type: z.enum(['', '']).default('ANNOUNCEMENT'),
  title: z.string().trim().min(1, 'Title is required'),
  content: z.string().trim().min(1, 'Content is required'),
  priority: z.enum(['', '', '', ''] as [string, ...string[]]).default('MEDIUM'),
  targetScope: z.enum(['', '', ''] as [string, ...string[]]).default('ALL'),
  departmentId: z.string().uuid('Invalid department ID format').optional().nullable(),
  courseId: z.string().uuid('Invalid course ID format').optional().nullable(),
  expiresAt: z.string().datetime({ message: 'Invalid ISO datetime for expiresAt' }).optional().nullable(),
});

function validateScopeFields(
  data: {
    targetScope?: 'ALL' | 'DEPARTMENT' | 'COURSE';
    departmentId?: string | null;
    courseId?: string | null;
  },
  ctx: z.RefinementCtx
) {
  if (data.targetScope === 'ALL') {
    if (data.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'departmentId must not be supplied when targetScope is ALL',
        path: ['departmentId'],
      });
    }
    if (data.courseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'courseId must not be supplied when targetScope is ALL',
        path: ['courseId'],
      });
    }
  } else if (data.targetScope === 'DEPARTMENT') {
    if (!data.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'departmentId is required when targetScope is DEPARTMENT',
        path: ['departmentId'],
      });
    }
    if (data.courseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'courseId must not be supplied when targetScope is DEPARTMENT',
        path: ['courseId'],
      });
    }
  } else if (data.targetScope === 'COURSE') {
    if (!data.courseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'courseId is required when targetScope is COURSE',
        path: ['courseId'],
      });
    }
    if (data.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'departmentId must not be supplied when targetScope is COURSE (derived from course)',
        path: ['departmentId'],
      });
    }
  }
}

export const createAnnouncementSchema = z.object({
  body: baseAnnouncementBody.superRefine(validateScopeFields),
});

export const updateAnnouncementSchema = z.object({
  body: baseAnnouncementBody
    .partial()
    .superRefine((data, ctx) => {
      if (data.targetScope) {
        validateScopeFields(data, ctx);
      }
    }),
});

export const listAnnouncementsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['', '']).optional(),
    targetScope: z.enum(['', '', ''] as [string, ...string[]]).optional(),
    priority: z.enum(['', '', '', ''] as [string, ...string[]]).optional(),
    isPublished: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    departmentId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
    search: z.string().trim().optional(),
  }),
});

// ─── INSTITUTIONAL EVENT SCHEMAS ────────────────────────────────────────────

const baseEventBody = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional().nullable(),
  category: z.enum(['EXAM', 'HOLIDAY', 'COLLEGE_EVENT', 'SEMINAR', 'WORKSHOP']).default('COLLEGE_EVENT'),
  startDate: z.string().datetime({ message: 'Invalid start date format' }),
  endDate: z.string().datetime({ message: 'Invalid end date format' }).optional().nullable(),
  location: z.string().trim().optional().nullable(),
  targetScope: z.enum(['', '', ''] as [string, ...string[]]).default('ALL'),
  departmentId: z.string().uuid('Invalid department ID format').optional().nullable(),
  courseId: z.string().uuid('Invalid course ID format').optional().nullable(),
  isPublished: z.boolean().default(true),
});

function validateEventRefinement(
  data: {
    startDate?: string;
    endDate?: string | null;
    targetScope?: 'ALL' | 'DEPARTMENT' | 'COURSE';
    departmentId?: string | null;
    courseId?: string | null;
  },
  ctx: z.RefinementCtx
) {
  if (data.startDate && data.endDate) {
    if (new Date(data.endDate) < new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endDate must not be before startDate',
        path: ['endDate'],
      });
    }
  }
  if (data.targetScope) {
    validateScopeFields(data, ctx);
  }
}

export const createInstitutionalEventSchema = z.object({
  body: baseEventBody.superRefine(validateEventRefinement),
});

export const updateInstitutionalEventSchema = z.object({
  body: baseEventBody.partial().superRefine(validateEventRefinement),
});

export const listInstitutionalEventsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.enum(['EXAM', 'HOLIDAY', 'COLLEGE_EVENT', 'SEMINAR', 'WORKSHOP']).optional(),
    targetScope: z.enum(['', '', ''] as [string, ...string[]]).optional(),
    isPublished: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    departmentId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
    search: z.string().trim().optional(),
  }),
});

// ─── ACADEMIC RESOURCE SCHEMAS ──────────────────────────────────────────────

export const createAcademicResourceSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().trim().optional().nullable(),
    fileUrl: z.string().url('Invalid file URL'),
    fileType: z.string().trim().min(1, 'File type is required'),
    category: z.enum(['SYLLABUS', 'PREVIOUS_PAPER', 'STUDY_GUIDE', 'TEMPLATE', 'OTHER']).default('SYLLABUS'),
    departmentId: z.string().uuid('Invalid department ID format').optional().nullable(),
    courseId: z.string().uuid('Invalid course ID format').optional().nullable(),
  }),
});

export const updateAcademicResourceSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional().nullable(),
    fileUrl: z.string().url().optional(),
    fileType: z.string().trim().min(1).optional(),
    category: z.enum(['SYLLABUS', 'PREVIOUS_PAPER', 'STUDY_GUIDE', 'TEMPLATE', 'OTHER']).optional(),
    departmentId: z.string().uuid().optional().nullable(),
    courseId: z.string().uuid().optional().nullable(),
  }),
});

export const listAcademicResourcesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.enum(['SYLLABUS', 'PREVIOUS_PAPER', 'STUDY_GUIDE', 'TEMPLATE', 'OTHER']).optional(),
    departmentId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
    search: z.string().trim().optional(),
  }),
});

// ─── TYPE INFERENCES ────────────────────────────────────────────────────────

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>['body'];
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>['body'];
export type ListAnnouncementsQuery = z.infer<typeof listAnnouncementsQuerySchema>['query'];

export type CreateInstitutionalEventInput = z.infer<typeof createInstitutionalEventSchema>['body'];
export type UpdateInstitutionalEventInput = z.infer<typeof updateInstitutionalEventSchema>['body'];
export type ListInstitutionalEventsQuery = z.infer<typeof listInstitutionalEventsQuerySchema>['query'];

export type CreateAcademicResourceInput = z.infer<typeof createAcademicResourceSchema>['body'];
export type UpdateAcademicResourceInput = z.infer<typeof updateAcademicResourceSchema>['body'];
export type ListAcademicResourcesQuery = z.infer<typeof listAcademicResourcesQuerySchema>['query'];
