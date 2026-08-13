import { z } from 'zod';

export const createCalendarEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    date: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    eventType: z.enum(['EXAM', 'HOLIDAY', 'COLLEGE_EVENT', 'CLASS']),
  }),
});

export const updateCalendarEventSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    date: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    eventType: z.enum(['EXAM', 'HOLIDAY', 'COLLEGE_EVENT', 'CLASS']).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>['body'];
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>['body'];
