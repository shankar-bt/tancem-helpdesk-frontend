import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useDepartments } from '@/modules/core/departments/hooks/useDepartments';
import { useDesignations } from '@/modules/core/designation/hooks/useDesignation';
import { useMasters } from '@/modules/core/masters/hooks/useMasters';
import { useRoles } from '@/modules/core/roles/hooks/useRoles';
import { isUserAdmin } from '@/shared/utils/roles';
import { getErrorMessage } from '@/shared/utils/errors';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCreateUser, useUpdateUser } from '../hooks/useUser';
import type { UpdateUserPayload, User, UserRole } from '../types';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess?: () => void;
}

export default function UserFormModal({ open, onClose, user, onSuccess }: UserFormModalProps) {
  const isEdit = Boolean(user);
  const currentUser = useAuthStore((s) => s.user);
  const notify = useNotificationStore((s) => s.notify);

  const { data: roles = [] } = useRoles();
  const isAdmin = isUserAdmin(currentUser, roles);
  const { data: departments = [] } = useDepartments();
  const { data: officeCategories = [] } = useMasters('office_category');
  const { data: designationsData } = useDesignations({ page: 1, limit: 100 });
  const designations = designationsData?.items ?? [];

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [roleId, setRoleId] = useState<string>('');
  const [designationId, setDesignationId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [officeCategory, setOfficeCategory] = useState<string>('');

  useEffect(() => {
    if (open) {
      setName(user?.name ?? '');
      setEmail(user?.email ?? '');
      setPassword('');
      const matched =
        roles.find((r) => r.id === user?.roleId) ||
        roles.find((r) => r.slug === user?.role) ||
        (user?.role === 'admin' ? roles.find((r) => r.slug === 'admin' || r.slug === 'administrator') : undefined);
      let initialRole = user?.role ?? 'user';
      if (matched) {
        if (matched.slug === 'admin' || matched.slug === 'administrator') initialRole = 'admin';
        else if (matched.slug === 'manager' || matched.name?.toLowerCase().includes('manager')) initialRole = 'manager';
        else if (matched.slug === 'agent') initialRole = 'agent';
      }
      setRole(initialRole);
      setRoleId(user?.roleId || matched?.id || '');
      setDesignationId((user as any)?.designationId ?? '');
      setDepartmentId(user?.departmentId ?? '');
      setOfficeCategory(user?.officeCategory ?? '');
    }
  }, [open, user, roles]);

  // When roleId or role changes, find selected role object
  const selectedRoleObj =
    roles.find((r) => r.id === roleId) ||
    roles.find((r) => r.slug === role) ||
    roles[0];

  const handleRoleChange = (newRoleId: string) => {
    setRoleId(newRoleId);
    const matched = roles.find((r) => r.id === newRoleId);
    if (matched) {
      if (matched.slug === 'admin' || matched.slug === 'administrator') setRole('admin');
      else if (matched.slug === 'manager' || matched.name?.toLowerCase().includes('manager')) setRole('manager');
      else if (matched.slug === 'agent') setRole('agent');
      else setRole('user');
    }
  };

  // Selecting Designation auto-selects its default Access Role, while still allowing manual override
  const handleDesignationChange = (newDesigId: string) => {
    setDesignationId(newDesigId);
    if (!newDesigId) return;

    const matched = designations.find((d) => d.id === newDesigId);
    if (matched) {
      const targetRole =
        roles.find((r) => r.id === matched.roleId) ||
        roles.find((r) => matched.roleSlug && r.slug.toLowerCase() === matched.roleSlug.toLowerCase()) ||
        roles.find((r) => matched.roleName && r.name.toLowerCase() === matched.roleName.toLowerCase());

      if (targetRole) {
        handleRoleChange(targetRole.id);
        notify(`Access Role set to: ${targetRole.name}`, 'info');
      }
    }
  };

  const isSubmitting = createUser.isPending || updateUser.isPending;
  const currentError = isEdit ? updateUser.error : createUser.error;
  const canEditRole = isAdmin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const matched = roles.find((r) => r.id === roleId);
    let resolvedRole = role;
    if (matched) {
      if (matched.slug === 'admin' || matched.slug === 'administrator') resolvedRole = 'admin';
      else if (matched.slug === 'manager' || matched.name?.toLowerCase().includes('manager')) resolvedRole = 'manager';
      else if (matched.slug === 'agent') resolvedRole = 'agent';
      else resolvedRole = 'user';
    }

    if (isEdit && user) {
      const payload: UpdateUserPayload = {
        name: name.trim(),
        email: email.trim(),
        roleId: roleId || undefined,
        role: canEditRole ? resolvedRole : undefined,
        designationId: designationId || null,
        departmentId: departmentId || null,
        officeCategory: officeCategory || null,
      };
      if (password.trim()) {
        if (password.trim().length < 8) {
          notify('Password must be at least 8 characters', 'error');
          return;
        }
        payload.password = password.trim();
      }

      updateUser.mutate(
        { id: user.id, payload },
        {
          onSuccess: () => {
            notify('User updated successfully');
            onClose();
            onSuccess?.();
          },
          onError: (err) => {
            notify(getErrorMessage(err), 'error');
          },
        },
      );
    } else {
      if (!password || password.length < 8) {
        notify('Password must be at least 8 characters', 'error');
        return;
      }

      createUser.mutate(
        {
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role: resolvedRole,
          roleId: roleId || selectedRoleObj?.id || undefined,
          designationId: designationId || null,
          departmentId: departmentId || null,
          officeCategory: officeCategory || null,
        },
        {
          onSuccess: (createdUser) => {
            notify(`Created user ${createdUser.name} with ${selectedRoleObj?.name || role} permissions`);
            onClose();
            onSuccess?.();
          },
          onError: (err) => {
            notify(getErrorMessage(err), 'error');
          },
        },
      );
    }
  };

  const permissionsList = selectedRoleObj?.permissions?.map((p) => p.name || (p as any).slug) ?? [];

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? `Edit User: ${user?.name}` : 'Add New User'}</DialogTitle>
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          <Stack gap={2.5} pt={1}>
            {currentError && <Alert severity="error">{getErrorMessage(currentError)}</Alert>}

            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
            />

            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />

            <TextField
              label={isEdit ? 'New Password (Optional)' : 'Password'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              helperText={isEdit ? 'Leave empty to keep current password.' : 'At least 8 characters.'}
            />

            {/* Designation Selector with Auto-Role Mapping */}
            <TextField
              label="Designation (Job Title)"
              select
              fullWidth
              value={designationId}
              onChange={(e) => handleDesignationChange(e.target.value)}
              helperText="Selecting a designation automatically sets the default Access Role."
            >
              <MenuItem value="">
                <em>None / Not Assigned</em>
              </MenuItem>
              {designations.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.title} ({d.code}) {d.roleName ? `— Role: ${d.roleName}` : ''}
                </MenuItem>
              ))}
            </TextField>

            {canEditRole && (
              <Box>
                <TextField
                  label="Access Role"
                  select
                  fullWidth
                  value={roleId || selectedRoleObj?.id || ''}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  helperText={
                    Boolean(designationId)
                      ? "Designation suggests this role, but you can change it here if needed."
                      : "Assigns permission level and privileges to this user"
                  }
                >
                  {roles.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name} ({r.slug})
                    </MenuItem>
                  ))}
                </TextField>

                {/* Display permissions granted by this role */}
                {permissionsList.length > 0 && (
                  <Box mt={1.5} p={1.5} bgcolor="#f8fafc" borderRadius={1.5} border="1px solid #e2e8f0">
                    <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
                      Access Permissions Granted to User ({permissionsList.length}):
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {permissionsList.map((perm) => (
                        <Chip
                          key={perm}
                          size="small"
                          label={perm}
                          sx={{
                            bgcolor: '#e0f2fe',
                            color: '#0369a1',
                            fontSize: '0.72rem',
                            height: 22,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
              <TextField
                label="Office Category"
                select
                fullWidth
                value={officeCategory}
                onChange={(e) => setOfficeCategory(e.target.value)}
                helperText="Office unit (e.g. Alangulam, Ariyalur)"
              >
                <MenuItem value="">
                  <em>None / Not Assigned</em>
                </MenuItem>
                {officeCategories.map((oc) => (
                  <MenuItem key={oc.id} value={oc.name}>
                    {oc.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Department"
                select
                fullWidth
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                helperText="Department (e.g. IT, HR, Maintenance)"
              >
                <MenuItem value="">
                  <em>None / Not Assigned</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
