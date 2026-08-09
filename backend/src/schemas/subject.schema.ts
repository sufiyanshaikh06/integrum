import { z } from 'zod';

export const createSubjectSchema = z.object({
  body: z.object({
    semesterId: z.string().uuid('Invalid semester ID'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    code: z.string().optional(),
    credits: z.number().int().nonnegative().optional(),
    targetGrade: z.number().nonnegative().optional(),
    totalClasses: z.number().int().nonnegative().optional(),
    attendedClasses: z.number().int().nonnegative().optional(),
  }),
});

export const updateSubjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().optional(),
    credits: z.number().int().nonnegative().optional(),
    targetGrade: z.number().nonnegative().optional(),
    totalClasses: z.number().int().nonnegative().optional(),
    attendedClasses: z.number().int().nonnegative().optional(),
  }),
});
