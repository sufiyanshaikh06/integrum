import { z } from 'zod';

export const createAttendanceRecordSchema = z.object({
  body: z.object({
    subjectId: z.string().uuid(),
    date: z.string().datetime(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    notes: z.string().optional(),
  }),
});

export const updateAttendanceRecordSchema = z.object({
  body: z.object({
    date: z.string().datetime().optional(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).optional(),
    notes: z.string().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateAttendanceRecordInput = z.infer<typeof createAttendanceRecordSchema>['body'];
export type UpdateAttendanceRecordInput = z.infer<typeof updateAttendanceRecordSchema>['body'];
