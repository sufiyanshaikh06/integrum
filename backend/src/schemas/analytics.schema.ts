import { z } from 'zod';

// Dashboard (existing)
export const getAnalyticsQuerySchema = z.object({
  query: z.object({}),
});

// AN-3: Activity breakdown with period + optional custom date range
export const getActivityQuerySchema = z.object({
  query: z
    .object({
      period: z.enum(['daily', 'weekly', 'custom']).optional().default('weekly'),
      startDate: z.string().datetime({ message: 'startDate must be a valid ISO 8601 datetime' }).optional(),
      endDate: z.string().datetime({ message: 'endDate must be a valid ISO 8601 datetime' }).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.period === 'custom') {
        if (!val.startDate || !val.endDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'period=custom requires both startDate and endDate',
            path: ['startDate'],
          });
          return;
        }
        if (new Date(val.startDate) > new Date(val.endDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'startDate must be before or equal to endDate',
            path: ['startDate'],
          });
        }
      }
    }),
});

export type ActivityQuery = z.infer<typeof getActivityQuerySchema>['query'];
