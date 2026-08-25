import { z } from 'zod';

export const listStudentsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    isVerified: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    courseId: z.string().uuid('Invalid course ID format').optional(),
  }),
});

export const listAdminsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    departmentId: z.string().uuid('Invalid department ID format').optional(),
  }),
});

export const createAdminSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    permissionsLevel: z.number().int().min(1).max(5).default(1),
    departmentId: z.string().uuid('Invalid department ID format').optional(),
  }),
});

export const updateUserStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean({ message: 'isActive boolean is required' }),
  }),
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['STUDENT', 'ADMIN'], {
      message: 'Role must be either STUDENT or ADMIN',
    }),
    permissionsLevel: z.number().int().min(1).max(5).optional(),
    departmentId: z.string().uuid('Invalid department ID format').optional().nullable(),
  }),
});

export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>['query'];
export type ListAdminsQuery = z.infer<typeof listAdminsQuerySchema>['query'];
export type CreateAdminInput = z.infer<typeof createAdminSchema>['body'];
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>['body'];
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>['body'];
