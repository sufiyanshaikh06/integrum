import { z } from 'zod';
import { ApplicationStatus, ApplicationType, EligibilityStatus } from '@prisma/client';

// Replacing history with [] explicitly clears it.
const careerFields = {
  applicationType: z.nativeEnum(ApplicationType).optional(),
  eligibilityStatus: z.nativeEnum(EligibilityStatus).optional(),
  interviewHistory: z.array(z.object({
    date: z.string().datetime(),
    round: z.string().trim().min(1).max(200),
    notes: z.string().max(5000).optional(),
    outcome: z.string().max(500).optional(),
  })).max(100).optional(),
};
export const listJobApplicationsSchema = z.object({
  query: z.object({ applicationType: z.nativeEnum(ApplicationType).optional() }),
});

// C-6: Structured offer details
const offerDetailsSchema = z.object({
  salary: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  benefits: z.string().optional(),
  deadline: z.string().datetime().optional(),
  notes: z.string().optional(),
}).optional();

export const createJobApplicationSchema = z.object({
  body: z.object({
    ...careerFields,
    companyName: z.string().min(1, 'Company name is required'),
    role: z.string().min(1, 'Role is required'),
    applicationUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    notes: z.string().optional(),
    appliedDate: z.string().datetime().optional(),
    status: z.nativeEnum(ApplicationStatus).optional(),
    // C-5: Interview schedule
    interviewDate: z.string().datetime().optional(),
    interviewRound: z.string().optional(),
    // C-6: Offer details
    offerDetails: offerDetailsSchema,
  }),
});

export const updateJobApplicationSchema = z.object({
  body: z.object({
    ...careerFields,
    companyName: z.string().min(1, 'Company name cannot be empty').optional(),
    role: z.string().min(1, 'Role cannot be empty').optional(),
    applicationUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    notes: z.string().optional(),
    appliedDate: z.string().datetime().optional(),
    status: z.nativeEnum(ApplicationStatus).optional(),
    // C-5
    interviewDate: z.string().datetime().optional(),
    interviewRound: z.string().optional(),
    // C-6
    offerDetails: offerDetailsSchema,
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateJobApplicationInput = z.infer<typeof createJobApplicationSchema>['body'];
export type UpdateJobApplicationInput = z.infer<typeof updateJobApplicationSchema>['body'];
