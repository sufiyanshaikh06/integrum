import { z } from 'zod';

export const createAssignmentSchema = z.object({
  body: z.object({
    subjectId: z.string().uuid('Invalid subject ID'),
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    status: z.enum(['PENDING', 'SUBMITTED', 'GRADED']).optional(),
  }),
});

export const updateAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    status: z.enum(['PENDING', 'SUBMITTED', 'GRADED']).optional(),
  }),
});
