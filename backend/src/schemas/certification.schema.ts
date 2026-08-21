import { z } from 'zod';

export const createCertificationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Certification name must be at least 2 characters'),
    issuer: z.string().min(1, 'Issuer is required'),
    dateObtained: z.string().datetime().optional(),
    expiryDate: z.string().datetime().optional(),
    credentialId: z.string().optional(),
    credentialUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  }),
});

export const updateCertificationSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    issuer: z.string().min(1).optional(),
    dateObtained: z.string().datetime().optional(),
    expiryDate: z.string().datetime().optional(),
    credentialId: z.string().optional(),
    credentialUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateCertificationInput = z.infer<typeof createCertificationSchema>['body'];
export type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>['body'];
