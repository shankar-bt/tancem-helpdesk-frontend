import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import type { Ticket } from '../types';
import { formatDate } from '@/shared/utils/format';

interface Props {
  ticket: Ticket;
  size?: 'small' | 'medium';
}

function formatRemaining(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return 'No SLA';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;

  let timeStr = '';
  if (hours > 0 && mins > 0) {
    timeStr = `${hours}h ${mins}m`;
  } else if (hours > 0) {
    timeStr = `${hours}h`;
  } else {
    timeStr = `${mins}m`;
  }

  if (minutes < 0) {
    return `Overdue by ${timeStr}`;
  }
  return `${timeStr} left`;
}

export default function SlaBadge({ ticket, size = 'small' }: Props) {
  const isClosedOrResolved = ticket.status === 'resolved' || ticket.status === 'closed';
  const isBreached = ticket.slaBreached || ticket.slaStatus === 'breached';
  const isAtRisk = ticket.slaStatus === 'at_risk';

  const dueTooltip = ticket.resolutionDueAt
    ? `Target Resolution: ${formatDate(ticket.resolutionDueAt)}`
    : 'No resolution deadline';

  if (isClosedOrResolved) {
    if (isBreached) {
      return (
        <Tooltip title={dueTooltip} arrow>
          <Chip
            size={size}
            icon={<ErrorOutlineIcon fontSize="inherit" />}
            label="Resolved (Breached)"
            color="error"
            variant="outlined"
            sx={{ fontWeight: 500, fontSize: '0.75rem' }}
          />
        </Tooltip>
      );
    }
    return (
      <Tooltip title={dueTooltip} arrow>
        <Chip
          size={size}
          icon={<CheckCircleOutlineIcon fontSize="inherit" />}
          label="Resolved in SLA"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 500, fontSize: '0.75rem' }}
        />
      </Tooltip>
    );
  }

  if (isBreached) {
    return (
      <Tooltip title={dueTooltip} arrow>
        <Chip
          size={size}
          icon={<ErrorOutlineIcon fontSize="inherit" />}
          label={
            ticket.slaRemainingMinutes !== null && ticket.slaRemainingMinutes !== undefined && ticket.slaRemainingMinutes < 0
              ? formatRemaining(ticket.slaRemainingMinutes)
              : 'Overdue'
          }
          color="error"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            color: '#dc2626',
            borderColor: '#ef4444',
          }}
          variant="outlined"
        />
      </Tooltip>
    );
  }

  if (isAtRisk) {
    return (
      <Tooltip title={dueTooltip} arrow>
        <Chip
          size={size}
          icon={<WarningAmberIcon fontSize="inherit" />}
          label={formatRemaining(ticket.slaRemainingMinutes)}
          color="warning"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            bgcolor: 'rgba(245, 158, 11, 0.1)',
            color: '#d97706',
            borderColor: '#f59e0b',
          }}
          variant="outlined"
        />
      </Tooltip>
    );
  }

  // within_sla
  return (
    <Tooltip title={dueTooltip} arrow>
      <Chip
        size={size}
        icon={<AccessTimeIcon fontSize="inherit" />}
        label={formatRemaining(ticket.slaRemainingMinutes)}
        color="success"
        sx={{
          fontWeight: 500,
          fontSize: '0.75rem',
          bgcolor: 'rgba(16, 185, 129, 0.08)',
          color: '#059669',
          borderColor: '#10b981',
        }}
        variant="outlined"
      />
    </Tooltip>
  );
}
