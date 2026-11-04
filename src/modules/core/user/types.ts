import { z } from 'zod';

export type UserRole = 'admin' | 'agent' | 'manager' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleId?: string | null;
  designationId?: string | null;
  departmentId?: string | null;
  officeCategory?: string | null;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  departmentId?: string;
  officeCategory?: string;
  designationId?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId?: string | null;
  officeCategory?: string | null;
  roleId?: string | null;
  designationId?: string | null;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  departmentId?: string | null;
  officeCategory?: string | null;
  roleId?: string | null;
  designationId?: string | null;
}

const name = z.string().trim().min(2, 'Name must be at least 2 characters');
const email = z.string().trim().min(1, 'Enter an email').email('Enter a valid email address');
const role = z.enum(['admin', 'agent', 'manager', 'user']);

export const createUserSchema = z.object({
  name,
  email,
  role,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  departmentId: z.string().optional().nullable(),
  officeCategory: z.string().optional().nullable(),
  roleId: z.string().optional().nullable(),
  designationId: z.string().optional().nullable(),
});

export const editUserSchema = z.object({
  name,
  email,
  role,
  password: z
    .string()
    .refine((v) => v === '' || v.length >= 8, 'Password must be at least 8 characters'),
  departmentId: z.string().optional().nullable(),
  officeCategory: z.string().optional().nullable(),
  roleId: z.string().optional().nullable(),
  designationId: z.string().optional().nullable(),
});

export type UserFormValues = z.infer<typeof createUserSchema>;
