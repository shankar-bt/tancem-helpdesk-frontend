import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormTextField } from '@/shared/design-system';
import { getErrorMessage } from '@/shared/utils/errors';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCreateDepartment, useUpdateDepartment } from '../hooks/useDepartments';
import { departmentSchema, type Department, type DepartmentFormValues } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  department?: Department | null;
  onSuccess?: () => void;
}

export default function DepartmentFormModal({ open, onClose, department, onSuccess }: Props) {
  const isEdit = Boolean(department);
  const notify = useNotificationStore((s) => s.notify);

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment(department?.id ?? '');

  const { control, handleSubmit, reset } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: department?.name ?? '',
      code: department?.code ?? '',
      description: department?.description ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: department?.name ?? '',
        code: department?.code ?? '',
        description: department?.description ?? '',
      });
    }
  }, [open, department, reset]);

  const isSubmitting = createDepartment.isPending || updateDepartment.isPending;
  const currentError = isEdit ? updateDepartment.error : createDepartment.error;

  const onSubmit = (values: DepartmentFormValues) => {
    if (isEdit && department) {
      updateDepartment.mutate(values, {
        onSuccess: () => {
          notify('Department updated successfully');
          onClose();
          onSuccess?.();
        },
      });
    } else {
      createDepartment.mutate(values, {
        onSuccess: (created) => {
          notify(`Created department ${created.name}`);
          onClose();
          onSuccess?.();
        },
      });
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? `Edit Department: ${department?.name}` : 'Add Department'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack gap={2.5} pt={1}>
            {currentError && <Alert severity="error">{getErrorMessage(currentError)}</Alert>}
            <FormTextField control={control} name="name" label="Department Name" autoFocus />
            <FormTextField
              control={control}
              name="code"
              label="Department Code (e.g. IT, HR)"
              slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
            />
            <FormTextField control={control} name="description" label="Description" multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Department'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
