import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HistoryIcon from '@mui/icons-material/History';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { LoadingBlock } from '@/shared/design-system';
import { getErrorMessage } from '@/shared/utils/errors';
import { formatDate } from '@/shared/utils/format';
import { useTicket, useTicketHistory } from '../hooks/useTickets';
import type { TicketHistoryEvent, TicketStatus } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  ticketId: string | null;
}

const statusColors: Record<TicketStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  open: 'info',
  in_progress: 'warning',
  pending_approval: 'secondary',
  resolved: 'success',
  closed: 'default',
  reopened: 'error',
};

export default function TicketHistoryModal({ open, onClose, ticketId }: Props) {
  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId ?? undefined);
  const { data: events = [], isLoading: historyLoading, error } = useTicketHistory(ticketId);

  const isLoading = ticketLoading || historyLoading;

  const getEventIcon = (type: TicketHistoryEvent['type']) => {
    switch (type) {
      case 'created':
        return <AddCircleOutlineIcon sx={{ color: '#2563eb', fontSize: 20 }} />;
      case 'assigned':
        return <AssignmentIndOutlinedIcon sx={{ color: '#7c3aed', fontSize: 20 }} />;
      case 'in_progress':
        return <PlayCircleOutlineIcon sx={{ color: '#d97706', fontSize: 20 }} />;
      case 'comment':
        return <ChatBubbleOutlineIcon sx={{ color: '#4f46e5', fontSize: 18 }} />;
      case 'sla_breached':
        return <ErrorOutlineIcon sx={{ color: '#dc2626', fontSize: 20 }} />;
      case 'resolved':
        return <CheckCircleOutlineIcon sx={{ color: '#16a34a', fontSize: 20 }} />;
      case 'closed':
        return <CheckCircleOutlineIcon sx={{ color: '#475569', fontSize: 20 }} />;
      case 'reopened':
        return <PlayCircleOutlineIcon sx={{ color: '#ea580c', fontSize: 20 }} />;
      default:
        return <HistoryIcon sx={{ color: '#64748b', fontSize: 20 }} />;
    }
  };

  const getEventBg = (type: TicketHistoryEvent['type']) => {
    switch (type) {
      case 'created':
        return '#eff6ff';
      case 'assigned':
        return '#f5f3ff';
      case 'in_progress':
        return '#fffbeb';
      case 'comment':
        return '#eef2ff';
      case 'sla_breached':
        return '#fef2f2';
      case 'resolved':
        return '#f0fdf4';
      case 'closed':
        return '#f8fafc';
      case 'reopened':
        return '#fff7ed';
      default:
        return '#f1f5f9';
    }
  };

  const getRoleChip = (roleSlug?: string | null, roleName?: string | null) => {
    const name = roleName || (roleSlug === 'admin' ? 'Super Admin' : roleSlug === 'agent' ? 'Support Agent' : 'User');
    const isSuperAdmin = roleSlug === 'admin' || roleSlug === 'administrator';
    const isAgent = roleSlug === 'agent';
    const isSystem = roleSlug === 'system';

    return (
      <Chip
        label={name}
        size="small"
        sx={{
          height: 20,
          fontSize: '0.68rem',
          fontWeight: 700,
          bgcolor: isSuperAdmin
            ? '#fee2e2'
            : isAgent
            ? '#ede9fe'
            : isSystem
            ? '#fef3c7'
            : '#f1f5f9',
          color: isSuperAdmin
            ? '#991b1b'
            : isAgent
            ? '#5b21b6'
            : isSystem
            ? '#92400e'
            : '#475569',
        }}
      />
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: '#f1f5f9',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HistoryIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Ticket Lifecycle History & Audit Trail
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Chronological log of all events from creation to resolution and closure.
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {isLoading && <LoadingBlock />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{getErrorMessage(error)}</Alert>}

        {ticket && (
          <Stack spacing={3}>
            {/* Header Ticket Information Summary */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#f8fafc',
                borderColor: '#e2e8f0',
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1} mb={1.5}>
                <Box>
                  <Typography variant="caption" color="primary.main" fontWeight={700}>
                    {ticket.ticketNumber}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                    {ticket.title}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={ticket.priority.toUpperCase()}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                  />
                  <Chip
                    label={ticket.status.replace('_', ' ').toUpperCase()}
                    color={statusColors[ticket.status] || 'default'}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                  />
                </Stack>
              </Box>

              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(4, 1fr)' }} gap={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Raised By:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {ticket.requester?.name || ticket.ticketRaisedBy || 'User'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Office / Dept:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {ticket.officeCategory || '—'} {ticket.department?.name ? `• ${ticket.department.name}` : ''}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Assigned Agent:</Typography>
                  <Typography variant="body2" fontWeight={600} color="#5b21b6">
                    {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Created Date:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatDate(ticket.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Vertical Chronological Timeline */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#0f172a" mb={2}>
                Timeline of Events ({events.length} Milestones)
              </Typography>

              {events.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No history events recorded yet.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ position: 'relative', pl: 3 }}>
                  {/* Vertical line connecting nodes */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 15,
                      top: 16,
                      bottom: 24,
                      width: 2,
                      bgcolor: '#e2e8f0',
                      zIndex: 1,
                    }}
                  />

                  <Stack spacing={2.5}>
                    {events.map((evt, idx) => (
                      <Box key={evt.id || idx} sx={{ position: 'relative', zIndex: 2 }}>
                        {/* Node Icon on the line */}
                        <Box
                          sx={{
                            position: 'absolute',
                            left: -24,
                            top: 10,
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: getEventBg(evt.type),
                            border: '2px solid #ffffff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {getEventIcon(evt.type)}
                        </Box>

                        {/* Event Card */}
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: '#ffffff',
                            borderColor: '#e2e8f0',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              borderColor: '#cbd5e1',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                            },
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                                {evt.title}
                              </Typography>
                              {evt.status && (
                                <Chip
                                  label={evt.status.replace('_', ' ').toUpperCase()}
                                  size="small"
                                  color={statusColors[evt.status] || 'default'}
                                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                />
                              )}
                            </Stack>

                            <Typography variant="caption" color="text.secondary">
                              {formatDate(evt.timestamp)}
                            </Typography>
                          </Box>

                          {/* Actor Info */}
                          {evt.actorName && (
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                              <Typography variant="caption" fontWeight={600} color="#475569">
                                By: {evt.actorName}
                              </Typography>
                              {getRoleChip(evt.actorRoleSlug, evt.actorRole)}
                            </Stack>
                          )}

                          {/* Event Description */}
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#334155',
                              lineHeight: 1.5,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {evt.description}
                          </Typography>

                          {/* Extra Event Details Cards */}
                          {evt.details && Object.keys(evt.details).length > 0 && (
                            <Box
                              sx={{
                                mt: 1.5,
                                p: 1.25,
                                bgcolor: '#f8fafc',
                                borderRadius: 1.5,
                                border: '1px solid #f1f5f9',
                                fontSize: '0.75rem',
                              }}
                            >
                              <Box display="flex" flexWrap="wrap" gap={2}>
                                {evt.details.resolutionNotes && (
                                  <Box sx={{ width: '100%' }}>
                                    <Typography variant="caption" fontWeight={700} color="success.main" display="block">
                                      Resolution Summary:
                                    </Typography>
                                    <Typography variant="caption" color="#334155">
                                      {evt.details.resolutionNotes}
                                    </Typography>
                                  </Box>
                                )}
                                {(evt.details.assignedTo || evt.details.assignedAgent) && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Assigned Agent:
                                    </Typography>
                                    <Typography variant="caption" fontWeight={600} color="#5b21b6">
                                      {evt.details.assignedTo || evt.details.assignedAgent}
                                    </Typography>
                                  </Box>
                                )}
                                {evt.details.firstResponseDueAt && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      First Response Target:
                                    </Typography>
                                    <Typography variant="caption" fontWeight={600}>
                                      {formatDate(evt.details.firstResponseDueAt)}
                                    </Typography>
                                  </Box>
                                )}
                                {evt.details.resolutionDueAt && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Resolution Target:
                                    </Typography>
                                    <Typography variant="caption" fontWeight={600}>
                                      {formatDate(evt.details.resolutionDueAt)}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          )}
                        </Paper>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Close History
        </Button>
      </DialogActions>
    </Dialog>
  );
}
