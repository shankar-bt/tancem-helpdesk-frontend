import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDepartments } from '@/modules/core/departments/hooks/useDepartments';
import { FormTextField } from '@/shared/design-system';
import { getErrorMessage } from '@/shared/utils/errors';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCreateTicket } from '../hooks/useTickets';
import { createTicketSchema, type CreateTicketFormValues } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TicketFormModal({ open, onClose, onSuccess }: Props) {
  const notify = useNotificationStore((s) => s.notify);
  const createTicket = useCreateTicket();
  const { data: departments = [] } = useDepartments();

  const { control, handleSubmit, reset } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'General',
      priority: 'medium',
      departmentId: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: '',
        description: '',
        category: 'General',
        priority: 'medium',
        departmentId: '',
      });
    }
  }, [open, reset]);

  const onSubmit = (values: CreateTicketFormValues) => {
    createTicket.mutate(
      {
        title: values.title,
        description: values.description,
        category: values.category,
        priority: values.priority,
        departmentId: values.departmentId || null,
      },
      {
        onSuccess: (created) => {
          notify(`Created ticket #${created.title}`);
          onClose();
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={createTicket.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Raise New Ticket</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack gap={2.5} pt={1}>
            {createTicket.error && <Alert severity="error">{getErrorMessage(createTicket.error)}</Alert>}
            <FormTextField control={control} name="title" label="Issue Title" autoFocus />
            <FormTextField control={control} name="category" label="Category (e.g. Hardware, Network, Software)" />
            <FormTextField control={control} name="priority" label="Priority" select>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </FormTextField>
            <FormTextField control={control} name="departmentId" label="Department" select>
              <MenuItem value="">None / Unassigned</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </MenuItem>
              ))}
            </FormTextField>
            <FormTextField control={control} name="description" label="Detailed Description" multiline rows={4} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={createTicket.isPending} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={createTicket.isPending}>
            {createTicket.isPending ? 'Submitting…' : 'Submit Ticket'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
