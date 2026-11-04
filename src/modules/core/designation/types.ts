import { z } from 'zod';

export interface Designation {
  id: string;
  code: string;
  title: string;
  description?: string;
  isActive: boolean;
  roleId?: string | null;
  roleName?: string | null;
  roleSlug?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListDesignationsParams {
  page: number;
  limit: number;
  search?: string;
  roleId?: string;
}

export interface CreateDesignationPayload {
  code: string;
  title: string;
  description?: string;
  isActive?: boolean;
  roleId?: string | null;
}

export interface UpdateDesignationPayload {
  code?: string;
  title?: string;
  description?: string;
  isActive?: boolean;
  roleId?: string | null;
}

export const designationSchema = z.object({
  code: z.string().trim().min(1, 'Code is required'),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
  isActive: z.boolean(),
  roleId: z.string().nullable().optional(),
});

export type DesignationFormValues = z.infer<typeof designationSchema>;
