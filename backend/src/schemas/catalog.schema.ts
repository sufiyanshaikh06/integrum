import { z } from 'zod';

const booleanQuery = z
  .enum(['true', 'false'])
  .transform(val => val === 'true');

export const getCoursesQuerySchema = z.object({
  query: z.object({
    departmentId: z.string().uuid('Invalid department ID').optional(),
    search: z.string().trim().optional(),
  }).strict(),
});

export const getSubjectsQuerySchema = z.object({
  query: z.object({
    courseId: z.string().uuid('Invalid course ID').optional(),
    semesterNumber: z.string().regex(/^\d+$/, 'Semester number must be an integer').transform(Number).refine(n => n >= 1, 'Semester number must be at least 1').optional(),
    search: z.string().trim().optional(),
  }).strict(),
});

export const getTermsQuerySchema = z.object({
  query: z.object({
    isActive: booleanQuery.optional(),
  }).strict(),
});

export type GetCoursesQuery = z.infer<typeof getCoursesQuerySchema>['query'];
export type GetSubjectsQuery = z.infer<typeof getSubjectsQuerySchema>['query'];
export type GetTermsQuery = z.infer<typeof getTermsQuerySchema>['query'];
