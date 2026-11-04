import { useEffect, useState } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Ticket } from '../types';
import { formatDateTime } from '@/shared/utils/format';

interface Props {
  ticket: Ticket;
  size?: 'small' | 'medium';
}

/**
 * Format remaining minutes into human-readable string:
 * - >= 24h: "2d 4h left"
 * - >= 1h: "3h 25m left"
 * - < 1h: "25m left"
 * - < 0: "Overdue by 1h 15m"
 */
export function formatSlaDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return 'No SLA';
  const abs = Math.abs(minutes);
  const days = Math.floor(abs / 1440);
  const hours = Math.floor((abs % 1440) / 60);
  const mins = abs % 60;

  let timeStr = '';
  if (days > 0) {
    timeStr = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  } else if (hours > 0 && mins > 0) {
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

/**
 * Hook to provide live ticking timestamp (every 30s)
 */
export function useLiveNow(intervalMs: number = 30000): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}

/**
 * Calculate dynamic real-time SLA metrics for a ticket
 */
export function computeTicketSlaMetrics(ticket: Ticket, now: number) {
  const isClosedOrResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  if (!ticket.resolutionDueAt) {
    return {
      isClosedOrResolved,
      remainingMinutes: ticket.slaRemainingMinutes ?? null,
      status: ticket.slaStatus || 'within_sla',
      isBreached: Boolean(ticket.slaBreached),
      isCritical: false,
      isAtRisk: false,
      percentElapsed: 0,
    };
  }

  const dueTime = new Date(ticket.resolutionDueAt).getTime();
  const createdTime = new Date(ticket.createdAt).getTime();
  const totalDuration = Math.max(1, dueTime - createdTime);

  if (isClosedOrResolved) {
    const resolvedTime = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : dueTime;
    const isBreached = Boolean(ticket.slaBreached) || resolvedTime > dueTime;
    const elapsed = Math.max(0, resolvedTime - createdTime);
    const percentElapsed = Math.min(100, Math.round((elapsed / totalDuration) * 100));

    return {
      isClosedOrResolved: true,
      remainingMinutes: 0,
      status: isBreached ? 'breached' : 'met',
      isBreached,
      isCritical: false,
      isAtRisk: false,
      percentElapsed,
    };
  }

  // Active ticket
  const diffMs = dueTime - now;
  const remainingMinutes = Math.round(diffMs / 60000);
  const isBreached = Boolean(ticket.slaBreached) || remainingMinutes < 0;
  const isCritical = !isBreached && remainingMinutes <= 30; // under 30 minutes
  const isAtRisk = !isBreached && remainingMinutes <= 120; // under 2 hours

  let status: 'breached' | 'at_risk' | 'within_sla' = 'within_sla';
  if (isBreached) {
    status = 'breached';
  } else if (isAtRisk) {
    status = 'at_risk';
  }

  const elapsed = Math.max(0, now - createdTime);
  const percentElapsed = isBreached
    ? 100
    : Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

  return {
    isClosedOrResolved: false,
    remainingMinutes,
    status,
    isBreached,
    isCritical,
    isAtRisk,
    percentElapsed,
  };
}

/**
 * Color-coded SLA progress bar component for Ticket detail modal & drawer
 */
export function SlaProgressBar({ ticket }: { ticket: Ticket }) {
  const now = useLiveNow(30000);
  const metrics = computeTicketSlaMetrics(ticket, now);

  if (!ticket.resolutionDueAt) {
    return null;
  }

  const barColor = metrics.isBreached
    ? '#ef4444'
    : metrics.isCritical
    ? '#dc2626'
    : metrics.isAtRisk
    ? '#f59e0b'
    : '#10b981';

  return (
    <Box sx={{ width: '100%', mt: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="caption" fontWeight={600} color={metrics.isBreached ? 'error.main' : 'text.secondary'}>
          {metrics.isBreached ? 'SLA Target Breached' : 'Resolution SLA Progress'}
        </Typography>
        <Typography variant="caption" fontWeight={700} sx={{ color: barColor }}>
          {metrics.isClosedOrResolved
            ? metrics.isBreached ? '100% (Breached)' : 'Resolved within SLA'
            : metrics.isBreached
            ? formatSlaDuration(metrics.remainingMinutes)
            : `${metrics.percentElapsed}% used • ${formatSlaDuration(metrics.remainingMinutes)}`}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={metrics.percentElapsed}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'rgba(0,0,0,0.06)',
          '& .MuiLinearProgress-bar': {
            bgcolor: barColor,
            borderRadius: 4,
            transition: 'transform 0.4s ease',
          },
        }}
      />
    </Box>
  );
}

export default function SlaBadge({ ticket, size = 'small' }: Props) {
  const now = useLiveNow(30000);
  const metrics = computeTicketSlaMetrics(ticket, now);

  const dueTooltipContent = (
    <Box sx={{ p: 0.5, maxWidth: 240 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
        SLA Resolution Status
      </Typography>
      <Typography variant="caption" sx={{ display: 'block' }}>
        Target: {ticket.resolutionDueAt ? formatDateTime(ticket.resolutionDueAt) : 'Not assigned'}
      </Typography>
      {ticket.firstResponseDueAt && (
        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.85)', mt: 0.25 }}>
          First Response: {formatDateTime(ticket.firstResponseDueAt)}
          {ticket.firstRespondedAt ? ' (✓)' : ''}
        </Typography>
      )}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 0.5,
          fontWeight: 600,
          color: metrics.isBreached ? '#fca5a5' : metrics.isAtRisk ? '#fde68a' : '#86efac',
        }}
      >
        {metrics.isClosedOrResolved
          ? metrics.isBreached ? 'Resolution SLA Breached' : 'Resolved within SLA Target'
          : metrics.isBreached
          ? `Overdue (${formatSlaDuration(metrics.remainingMinutes)})`
          : metrics.isCritical
          ? `CRITICAL: Under 30 minutes remaining!`
          : metrics.isAtRisk
          ? `At-Risk: Escalation recommended`
          : `Healthy: Within target SLA`}
      </Typography>
    </Box>
  );

  // 1. Resolved or Closed tickets
  if (metrics.isClosedOrResolved) {
    if (metrics.isBreached) {
      return (
        <Tooltip title={dueTooltipContent} arrow>
          <Chip
            size={size}
            icon={<ErrorOutlineIcon fontSize="inherit" />}
            label="Resolved (Breached)"
            color="error"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
        </Tooltip>
      );
    }
    return (
      <Tooltip title={dueTooltipContent} arrow>
        <Chip
          size={size}
          icon={<CheckCircleOutlineIcon fontSize="inherit" />}
          label="Resolved in SLA"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />
      </Tooltip>
    );
  }

  // 2. Active Breached tickets
  if (metrics.isBreached) {
    return (
      <Tooltip title={dueTooltipContent} arrow>
        <Chip
          size={size}
          icon={
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                animation: 'pulseSlaBreach 1.8s infinite ease-in-out',
                '@keyframes pulseSlaBreach': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.2)', opacity: 0.7 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            >
              <ErrorOutlineIcon fontSize="inherit" />
            </Box>
          }
          label={formatSlaDuration(metrics.remainingMinutes)}
          color="error"
          sx={{
            fontWeight: 700,
            fontSize: '0.75rem',
            bgcolor: 'rgba(239, 68, 68, 0.12)',
            color: '#dc2626',
            borderColor: '#ef4444',
            borderWidth: 1.5,
            borderStyle: 'solid',
          }}
          variant="outlined"
        />
      </Tooltip>
    );
  }

  // 3. Active Critical tickets (< 30 minutes left)
  if (metrics.isCritical) {
    return (
      <Tooltip title={dueTooltipContent} arrow>
        <Chip
          size={size}
          icon={
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#dc2626',
                animation: 'pulseDot 1.2s infinite ease-in-out',
                '@keyframes pulseDot': {
                  '0%': { transform: 'scale(0.9)', opacity: 0.6 },
                  '50%': { transform: 'scale(1.3)', opacity: 1 },
                  '100%': { transform: 'scale(0.9)', opacity: 0.6 },
                },
              }}
            />
          }
          label={`Urgent: ${formatSlaDuration(metrics.remainingMinutes)}`}
          sx={{
            fontWeight: 700,
            fontSize: '0.75rem',
            bgcolor: 'rgba(239, 68, 68, 0.15)',
            color: '#b91c1c',
            borderColor: '#f87171',
            borderWidth: 1.5,
            borderStyle: 'solid',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.25)',
          }}
          variant="outlined"
        />
      </Tooltip>
    );
  }

  // 4. Active At-Risk tickets (30m - 120m left)
  if (metrics.isAtRisk) {
    return (
      <Tooltip title={dueTooltipContent} arrow>
        <Chip
          size={size}
          icon={
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                animation: 'pulseSlaWarn 2s infinite ease-in-out',
                '@keyframes pulseSlaWarn': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            >
              <WarningAmberIcon fontSize="inherit" />
            </Box>
          }
          label={`At Risk: ${formatSlaDuration(metrics.remainingMinutes)}`}
          color="warning"
          sx={{
            fontWeight: 700,
            fontSize: '0.75rem',
            bgcolor: 'rgba(245, 158, 11, 0.12)',
            color: '#b45309',
            borderColor: '#f59e0b',
            borderWidth: 1.5,
            borderStyle: 'solid',
          }}
          variant="outlined"
        />
      </Tooltip>
    );
  }

  // 5. Active tickets Within SLA
  return (
    <Tooltip title={dueTooltipContent} arrow>
      <Chip
        size={size}
        icon={<AccessTimeIcon fontSize="inherit" />}
        label={formatSlaDuration(metrics.remainingMinutes)}
        color="success"
        sx={{
          fontWeight: 600,
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
