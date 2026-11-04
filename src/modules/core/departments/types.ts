import { z } from 'zod';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentPayload {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  code?: string;
  description?: string;
}

export const departmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters').max(120),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Department code must be at least 2 characters')
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, 'Department code must only contain letters, numbers, dashes, and underscores'),
  description: z.string().trim().max(500).optional(),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;
