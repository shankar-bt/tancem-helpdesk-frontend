import { z } from 'zod';

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  module?: string | null;
}

export interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRolePayload {
  name: string;
  slug: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export const roleSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'Slug must only contain lowercase letters, numbers, dashes and underscores'),
  description: z.string().trim().max(255).optional(),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
