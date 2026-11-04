import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRoles } from '@/modules/core/roles/hooks/useRoles';
import { FormTextField } from '@/shared/design-system';
import { isUserAdmin } from '@/shared/utils';
import { getErrorMessage } from '@/shared/utils/errors';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCreateDesignation, useUpdateDesignation } from '../hooks/useDesignation';
import {
  designationSchema,
  type Designation,
  type DesignationFormValues,
  type UpdateDesignationPayload,
} from '../types';

interface DesignationFormModalProps {
  open: boolean;
  onClose: () => void;
  designation?: Designation | null;
  onSuccess?: () => void;
}

export default function DesignationFormModal({ open, onClose, designation, onSuccess }: DesignationFormModalProps) {
  const isEdit = Boolean(designation);
  const notify = useNotificationStore((s) => s.notify);
  const currentUser = useAuthStore((s) => s.user);

  const { data: roles = [] } = useRoles();
  const isAdmin = isUserAdmin(currentUser, roles);

  const createDesignation = useCreateDesignation();
  const updateDesignation = useUpdateDesignation(designation?.id ?? '');

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const { control, handleSubmit, reset } = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema),
    defaultValues: {
      code: designation?.code ?? '',
      title: designation?.title ?? '',
      description: designation?.description ?? '',
      isActive: designation?.isActive ?? true,
      roleId: designation?.roleId ?? null,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        code: designation?.code ?? '',
        title: designation?.title ?? '',
        description: designation?.description ?? '',
        isActive: designation?.isActive ?? true,
        roleId: designation?.roleId ?? null,
      });
      setSelectedRoleId(designation?.roleId ?? '');
    }
  }, [open, designation, reset]);

  const isSubmitting = createDesignation.isPending || updateDesignation.isPending;
  const currentError = isEdit ? updateDesignation.error : createDesignation.error;

  const onSubmit = (values: DesignationFormValues) => {
    const roleIdToSave = isAdmin ? (selectedRoleId || null) : (designation?.roleId ?? null);

    if (isEdit && designation) {
      const payload: UpdateDesignationPayload = {
        code: values.code,
        title: values.title,
        description: values.description,
        isActive: values.isActive,
        roleId: roleIdToSave,
      };

      updateDesignation.mutate(payload, {
        onSuccess: () => {
          notify('Designation updated successfully');
          onClose();
          onSuccess?.();
        },
      });
    } else {
      createDesignation.mutate(
        {
          ...values,
          roleId: roleIdToSave,
        },
        {
          onSuccess: (created) => {
            notify(`Created designation ${created.title}`);
            onClose();
            onSuccess?.();
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? `Edit Designation: ${designation?.title}` : 'Add New Designation'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack gap={2.5} pt={1}>
            {currentError && <Alert severity="error">{getErrorMessage(currentError)}</Alert>}
            <FormTextField control={control} name="code" label="Designation Code (e.g. SE, MGR, AGT)" autoFocus />
            <FormTextField control={control} name="title" label="Designation Title (e.g. Senior Engineer)" />

            {/* Access Role Assignment - Admin Only */}
            <FormControl fullWidth size="small" disabled={!isAdmin}>
              <InputLabel id="designation-role-select-label">Assigned Access Role</InputLabel>
              <Select
                labelId="designation-role-select-label"
                label="Assigned Access Role"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
              >
                <MenuItem value="">
                  <em>None (Unassigned)</em>
                </MenuItem>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {isAdmin
                  ? 'Employees with this designation will automatically receive this access role and privileges.'
                  : 'Only Administrators can assign access roles to designations.'}
              </FormHelperText>
            </FormControl>

            <FormTextField control={control} name="description" label="Description" multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Designation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
