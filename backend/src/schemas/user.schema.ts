import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    university: z.string().optional(),
    enrollmentYear: z.number().int().min(1900).max(2100).optional(),
    graduationYear: z.number().int().min(1900).max(2100).optional(),
    careerGoals: z.string().optional(),
    socialLinks: z.object({
      linkedin: z.string().url().optional().or(z.literal('')),
      github: z.string().url().optional().or(z.literal('')),
      portfolio: z.string().url().optional().or(z.literal('')),
      twitter: z.string().url().optional().or(z.literal('')),
    }).optional(),
  }),
});
