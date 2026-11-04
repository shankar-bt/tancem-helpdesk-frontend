import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/shared/utils/errors';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUpdateSlaPolicy } from '../hooks/useSla';
import type { SlaPolicy } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  policy: SlaPolicy | null;
}

export default function SlaPolicyModal({ open, onClose, policy }: Props) {
  const notify = useNotificationStore((s) => s.notify);
  const updatePolicy = useUpdateSlaPolicy();

  const [name, setName] = useState('');
  const [responseHours, setResponseHours] = useState(0);
  const [responseMinutes, setResponseMinutes] = useState(0);
  const [resolutionHours, setResolutionHours] = useState(0);
  const [resolutionMinutes, setResolutionMinutes] = useState(0);

  useEffect(() => {
    if (policy) {
      setName(policy.name);
      setResponseHours(Math.floor(policy.responseTimeMinutes / 60));
      setResponseMinutes(policy.responseTimeMinutes % 60);
      setResolutionHours(Math.floor(policy.resolutionTimeMinutes / 60));
      setResolutionMinutes(policy.resolutionTimeMinutes % 60);
    }
  }, [policy]);

  if (!policy) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const totalResponse = responseHours * 60 + responseMinutes;
    const totalResolution = resolutionHours * 60 + resolutionMinutes;

    if (totalResponse <= 0) {
      notify('First response target must be greater than 0 minutes', 'error');
      return;
    }

    if (totalResolution <= totalResponse) {
      notify('Resolution target must be longer than the first response target', 'error');
      return;
    }

    updatePolicy.mutate(
      {
        id: policy.id,
        payload: {
          name: name.trim() || policy.name,
          responseTimeMinutes: totalResponse,
          resolutionTimeMinutes: totalResolution,
        },
      },
      {
        onSuccess: () => {
          notify(`Updated ${policy.priority.toUpperCase()} SLA policy successfully`);
          onClose();
        },
        onError: (err) => {
          notify(getErrorMessage(err), 'error');
        },
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Edit SLA Policy
            </Typography>
            <Chip
              label={policy.priority.toUpperCase()}
              size="small"
              color={
                policy.priority === 'urgent'
                  ? 'error'
                  : policy.priority === 'high'
                  ? 'warning'
                  : policy.priority === 'medium'
                  ? 'info'
                  : 'default'
              }
              sx={{ fontWeight: 600 }}
            />
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3} pt={1}>
            <TextField
              label="Policy Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              size="small"
              required
            />

            {/* Response Time Target */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                Target First Response Time
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                Maximum time allowed before an agent assigns or acknowledges the ticket.
              </Typography>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Hours"
                  type="number"
                  size="small"
                  value={responseHours}
                  onChange={(e) => setResponseHours(Math.max(0, parseInt(e.target.value) || 0))}
                  slotProps={{ htmlInput: { min: 0 } }}
                  fullWidth
                />
                <TextField
                  label="Minutes"
                  type="number"
                  size="small"
                  value={responseMinutes}
                  onChange={(e) => setResponseMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  slotProps={{ htmlInput: { min: 0, max: 59 } }}
                  fullWidth
                />
              </Stack>
              <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                Total: {responseHours * 60 + responseMinutes} minutes
              </Typography>
            </Box>

            {/* Resolution Time Target */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                Target Resolution Time
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                Maximum time allowed to resolve and close the ticket.
              </Typography>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Hours"
                  type="number"
                  size="small"
                  value={resolutionHours}
                  onChange={(e) => setResolutionHours(Math.max(0, parseInt(e.target.value) || 0))}
                  slotProps={{ htmlInput: { min: 0 } }}
                  fullWidth
                />
                <TextField
                  label="Minutes"
                  type="number"
                  size="small"
                  value={resolutionMinutes}
                  onChange={(e) => setResolutionMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  slotProps={{ htmlInput: { min: 0, max: 59 } }}
                  fullWidth
                />
              </Stack>
              <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                Total: {resolutionHours * 60 + resolutionMinutes} minutes ({((resolutionHours * 60 + resolutionMinutes) / 60).toFixed(1)} hrs)
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={updatePolicy.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={updatePolicy.isPending}>
            {updatePolicy.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
