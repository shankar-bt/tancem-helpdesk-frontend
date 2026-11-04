import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { LoadingBlock, PageHeader } from '@/shared/design-system';
import { useSlaPolicies } from '../hooks/useSla';
import type { SlaPolicy } from '../types';
import SlaPolicyModal from './SlaPolicyModal';

function formatHoursAndMins(totalMins: number): string {
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0 && mins > 0) return `${hours} hr ${mins} min`;
  if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${mins} min`;
}

const priorityColors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  urgent: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const priorityThemes: Record<string, { border: string; bg: string }> = {
  urgent: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.04)' },
  high: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.04)' },
  medium: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.04)' },
  low: { border: '#6b7280', bg: 'rgba(107, 114, 128, 0.04)' },
};

export default function SlaPage() {
  const { data: policies = [], isLoading } = useSlaPolicies();
  const [editingPolicy, setEditingPolicy] = useState<SlaPolicy | null>(null);

  return (
    <>
      <PageHeader
        title="SLA Policies"
        description="Configure target first response and resolution time windows based on ticket priority."
      />

      {isLoading ? (
        <LoadingBlock />
      ) : (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={2.5}>
          {policies.map((p) => {
            const theme = priorityThemes[p.priority] || priorityThemes.low;
            return (
              <Card
                key={p.id}
                variant="outlined"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  borderColor: theme.border,
                  bgcolor: theme.bg,
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Chip
                      label={p.priority.toUpperCase()}
                      size="small"
                      color={priorityColors[p.priority] || 'default'}
                      sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      icon={<CheckCircleOutline fontSize="small" />}
                      label="Active"
                      color="success"
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  </Stack>

                  <Typography variant="h6" fontWeight={700} mb={1}>
                    {p.name}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Service standards for tickets flagged as {p.priority} priority.
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                        <AccessTimeIcon sx={{ fontSize: 13 }} /> First Response Target
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {formatHoursAndMins(p.responseTimeMinutes)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                        <AccessTimeIcon sx={{ fontSize: 13 }} /> Resolution Target
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {formatHoursAndMins(p.resolutionTimeMinutes)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<EditOutlined fontSize="small" />}
                    onClick={() => setEditingPolicy(p)}
                    sx={{ textTransform: 'none' }}
                  >
                    Edit Policy
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Box>
      )}

      <SlaPolicyModal
        open={Boolean(editingPolicy)}
        onClose={() => setEditingPolicy(null)}
        policy={editingPolicy}
      />
    </>
  );
}
