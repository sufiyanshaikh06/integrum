import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

export const createJobApplicationSchema = z.object({
  body: z.object({
    companyName: z.string().min(1, 'Company name is required'),
    role: z.string().min(1, 'Role is required'),
    applicationUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    notes: z.string().optional(),
    appliedDate: z.string().datetime().optional(),
    status: z.nativeEnum(ApplicationStatus).optional(),
  }),
});

export const updateJobApplicationSchema = z.object({
  body: z.object({
    companyName: z.string().min(1, 'Company name cannot be empty').optional(),
    role: z.string().min(1, 'Role cannot be empty').optional(),
    applicationUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    notes: z.string().optional(),
    appliedDate: z.string().datetime().optional(),
    status: z.nativeEnum(ApplicationStatus).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateJobApplicationInput = z.infer<typeof createJobApplicationSchema>['body'];
export type UpdateJobApplicationInput = z.infer<typeof updateJobApplicationSchema>['body'];
