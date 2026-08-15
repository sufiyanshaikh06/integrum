import { z } from 'zod';
import { SkillCategory } from '@prisma/client';

export const createSkillSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Skill name is required'),
    category: z.nativeEnum(SkillCategory, {
      errorMap: () => ({ message: 'Category must be TECHNICAL or SOFT' }),
    }),
    proficiencyLevel: z.number().int().min(1).max(5).optional(),
  }),
});

export const updateSkillSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Skill name cannot be empty').optional(),
    category: z.nativeEnum(SkillCategory).optional(),
    proficiencyLevel: z.number().int().min(1).max(5).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>['body'];
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>['body'];
