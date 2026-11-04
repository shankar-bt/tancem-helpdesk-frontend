import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/shared/utils/errors';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCreateMaster, useMasters, useUpdateMaster } from '../hooks/useMasters';
import { MASTER_CONFIGS, type MasterType, type TicketMaster } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  masterType: MasterType;
  typeLabel: string;
  item?: TicketMaster | null;
  onSuccess?: () => void;
}

export default function MasterFormModal({ open, onClose, masterType, typeLabel, item, onSuccess }: Props) {
  const isEdit = Boolean(item);
  const notify = useNotificationStore((s) => s.notify);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');

  const currentConfig = MASTER_CONFIGS.find((c) => c.type === masterType);
  const parentType = currentConfig?.parentType;
  const parentLabel = currentConfig?.parentLabel;

  // Load potential parents if this type has a hierarchy parent
  const { data: parentOptions = [] } = useMasters(parentType);

  const createMaster = useCreateMaster();
  const updateMaster = useUpdateMaster(item?.id ?? '');

  useEffect(() => {
    if (open) {
      setName(item?.name ?? '');
      setCode(item?.code ?? '');
      setDescription(item?.description ?? '');
      setParentId(item?.parentId ?? '');
    }
  }, [open, item]);

  const isSubmitting = createMaster.isPending || updateMaster.isPending;
  const currentError = isEdit ? updateMaster.error : createMaster.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEdit && item) {
      updateMaster.mutate(
        {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          parentId: parentId || null,
        },
        {
          onSuccess: () => {
            notify(`${typeLabel} updated successfully`);
            onClose();
            onSuccess?.();
          },
        },
      );
    } else {
      createMaster.mutate(
        {
          type: masterType,
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          parentId: parentId || null,
        },
        {
          onSuccess: (created) => {
            notify(`Created ${typeLabel}: ${created.name}`);
            onClose();
            onSuccess?.();
          },
        },
      );
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? `Edit ${typeLabel}` : `Add New ${typeLabel}`}</DialogTitle>
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          <Stack gap={2.5} pt={1}>
            {currentError && <Alert severity="error">{getErrorMessage(currentError)}</Alert>}

            {parentType && (
              <TextField
                select
                label={`Parent ${parentLabel}`}
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                fullWidth
                helperText={`Select which ${parentLabel} this ${typeLabel} falls under`}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="">
                  <em>None (Top Level / General)</em>
                </MenuItem>
                {parentOptions.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} {p.code ? `(${p.code})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus={!parentType}
              placeholder={`Enter ${typeLabel.toLowerCase()} name`}
            />
            <TextField
              label="Short Code (Optional)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              fullWidth
              placeholder="e.g. HW, PRN, HO"
            />
            <TextField
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Item'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
