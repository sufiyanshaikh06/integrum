// @ts-nocheck
import { z } from 'zod';

export const reportQuerySchema = z.object({
  query: z
    .object({
      startDate: z.string().datetime({ message: 'startDate must be a valid ISO datetime' }).optional(),
      endDate: z.string().datetime({ message: 'endDate must be a valid ISO datetime' }).optional(),
      period: z.enum(['', '', ''] as [string, ...string[]]).default('daily').optional(),
      courseId: z.string().uuid({ message: 'courseId must be a valid UUID' }).optional(),
      departmentId: z.string().uuid({ message: 'departmentId must be a valid UUID' }).optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.startDate) <= new Date(data.endDate);
        }
        return true;
      },
      {
        message: 'startDate must not be after endDate',
        path: ['endDate'],
      }
    ),
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>['query'];
