import { z } from 'zod';

export const createCalendarEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    date: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    eventType: z.enum(['EXAM', 'HOLIDAY', 'COLLEGE_EVENT', 'CLASS']),
  }).refine(data => {
    if (!data.endDate) return true;
    return new Date(data.endDate) >= new Date(data.date);
  }, {
    message: 'End date must be greater than or equal to start date',
    path: ['endDate'],
  }),
});

export const updateCalendarEventSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    date: z.string().datetime().optional(),
    endDate: z.string().datetime().nullable().optional(),
    eventType: z.enum(['EXAM', 'HOLIDAY', 'COLLEGE_EVENT', 'CLASS']).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }).refine(data => {
    if (data.date !== undefined && data.endDate !== undefined && data.endDate !== null) {
      return new Date(data.endDate) >= new Date(data.date);
    }
    return true;
  }, {
    message: 'End date must be greater than or equal to start date',
    path: ['endDate'],
  }),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>['body'];
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>['body'];
