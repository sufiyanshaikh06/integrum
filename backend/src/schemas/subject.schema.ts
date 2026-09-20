import { z } from 'zod';

export const createSubjectSchema = z.object({
  body: z.object({
    semesterId: z.string().uuid('Invalid semester ID'),
    masterSubjectId: z.string().uuid().nullable().optional(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    code: z.string().optional(),
    credits: z.number().int().nonnegative().optional(),
    targetGrade: z.number().nonnegative().optional(),
    totalClasses: z.number().int().nonnegative().optional(),
    attendedClasses: z.number().int().nonnegative().optional(),
    attendanceGoal: z.number().min(0).max(100).optional(),
  }),
});

export const updateSubjectSchema = z.object({
  body: z.object({
    masterSubjectId: z.string().uuid().nullable().optional(),
    name: z.string().min(2).optional(),
    code: z.string().optional(),
    credits: z.number().int().nonnegative().optional(),
    targetGrade: z.number().nonnegative().optional(),
    totalClasses: z.number().int().nonnegative().optional(),
    attendedClasses: z.number().int().nonnegative().optional(),
    attendanceGoal: z.number().min(0).max(100).optional(),
  }),
});

export const syllabusLookupSchema = z.object({ query: z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}) });
