import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import ArrowForward from '@mui/icons-material/ArrowForward';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import HourglassEmptyOutlined from '@mui/icons-material/HourglassEmptyOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { paths } from '@/app/paths';
import { useDepartments } from '@/modules/core/departments/hooks/useDepartments';
import { useTickets, useTicketStats } from '@/modules/core/tickets/hooks/useTickets';
import SlaBadge from '@/modules/core/tickets/ui/SlaBadge';
import { LoadingBlock } from '@/shared/design-system';
import { formatDate } from '@/shared/utils/format';

// 3D Card Style Helper
const card3dStyle = (accentColor: string, isClickable = false) => ({
  position: 'relative' as const,
  borderRadius: '20px',
  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  border: '1px solid rgba(226, 232, 240, 0.9)',
  boxShadow:
    '0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.03), inset 0 1px 1px 0 rgba(255, 255, 255, 1)',
  overflow: 'hidden' as const,
  transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
  cursor: isClickable ? 'pointer' : 'default',
  textDecoration: 'none',
  color: 'inherit',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: accentColor,
    boxShadow: `0 2px 12px ${accentColor}`,
  },
  '&:hover': {
    transform: 'translateY(-6px) perspective(1000px) rotateX(1.5deg)',
    boxShadow: `0 20px 35px -10px rgba(15, 23, 42, 0.12), 0 12px 18px -6px rgba(15, 23, 42, 0.08), 0 0 0 1px ${accentColor}30, inset 0 1px 1px 0 rgba(255, 255, 255, 1)`,
  },
});

// 3D Embossed Floating Icon
const icon3dStyle = (gradient: string, shadowColor: string) => ({
  width: 52,
  height: 52,
  borderRadius: '16px',
  background: gradient,
  boxShadow: `0 10px 20px -3px ${shadowColor}, inset 0 -3px 5px rgba(0,0,0,0.22), inset 0 2px 4px rgba(255,255,255,0.45)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  flexShrink: 0,
  transform: 'perspective(600px) rotateY(-8deg) rotateX(5deg)',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'perspective(600px) rotateY(0deg) scale(1.08)',
  },
});

const STATUS_COLORS: Record<string, string> = {
  Open: '#3b82f6',
  'In Progress': '#f59e0b',
  Pending: '#8b5cf6',
  Resolved: '#10b981',
  Closed: '#64748b',
  Reopened: '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#ef4444',
  High: '#f97316',
  Medium: '#3b82f6',
  Low: '#64748b',
};

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DashboardPage() {
  const { data: ticketData, isLoading: ticketLoading } = useTickets({ page: 1, limit: 6 });
  const { data: stats, isLoading: statsLoading } = useTicketStats();
  const { data: departments = [] } = useDepartments();

  // Status Donut Chart Data
  const statusChartData = useMemo(() => {
    if (!stats?.byStatus) return [];
    const b = stats.byStatus;
    const items = [
      { name: 'Open', value: b.open, color: STATUS_COLORS.Open },
      { name: 'In Progress', value: b.in_progress, color: STATUS_COLORS['In Progress'] },
      { name: 'Pending', value: b.pending_approval, color: STATUS_COLORS.Pending },
      { name: 'Resolved', value: b.resolved, color: STATUS_COLORS.Resolved },
      { name: 'Closed', value: b.closed, color: STATUS_COLORS.Closed },
      { name: 'Reopened', value: b.reopened, color: STATUS_COLORS.Reopened },
    ];
    return items.filter((i) => i.value > 0);
  }, [stats]);

  // Priority Bar Chart Data
  const priorityChartData = useMemo(() => {
    if (!stats?.byPriority) return [];
    const p = stats.byPriority;
    return [
      { name: 'Urgent', count: p.urgent, color: PRIORITY_COLORS.Urgent },
      { name: 'High', count: p.high, color: PRIORITY_COLORS.High },
      { name: 'Medium', count: p.medium, color: PRIORITY_COLORS.Medium },
      { name: 'Low', count: p.low, color: PRIORITY_COLORS.Low },
    ];
  }, [stats]);

  // Category Distribution Data
  const categoryChartData = useMemo(() => {
    if (!stats?.byCategory) return [];
    return stats.byCategory.map((c, idx) => ({
      name: c.name,
      count: c.count,
      fill: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));
  }, [stats]);

  const activeTicketsCount = (stats?.byStatus?.open ?? 0) + (stats?.byStatus?.in_progress ?? 0);
  const resolvedTicketsCount = (stats?.byStatus?.resolved ?? 0) + (stats?.byStatus?.closed ?? 0);

  return (
    <>
      {/* PRIMARY 3D KPI METRIC CARDS */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={2.5} mb={3.5}>
        {/* Card 1: Total Tickets */}
        <Box sx={card3dStyle('#3b82f6')}>
          <Box p={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box sx={icon3dStyle('linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 'rgba(37,99,235,0.4)')}>
                <ConfirmationNumberOutlined sx={{ fontSize: 28 }} />
              </Box>
              <Chip
                size="small"
                label="All Queues"
                sx={{
                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              />
            </Stack>
            <Typography variant="h3" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '-0.03em', mb: 0.5 }}>
              {ticketLoading ? '…' : ticketData?.meta.total ?? 0}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="#475569">
              Total Tickets Logged
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lifetime volume in support database
            </Typography>
          </Box>
        </Box>

        {/* Card 2: Active / In-Progress */}
        <Box sx={card3dStyle('#f59e0b')}>
          <Box p={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box sx={icon3dStyle('linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 'rgba(217,119,6,0.4)')}>
                <HourglassEmptyOutlined sx={{ fontSize: 28 }} />
              </Box>
              <Chip
                size="small"
                label="In Motion"
                sx={{
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  color: '#d97706',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              />
            </Stack>
            <Typography variant="h3" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '-0.03em', mb: 0.5 }}>
              {statsLoading ? '…' : activeTicketsCount}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="#475569">
              Active & In Progress
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Assigned agents currently addressing
            </Typography>
          </Box>
        </Box>

        {/* Card 3: Resolved & Closed */}
        <Box sx={card3dStyle('#10b981')}>
          <Box p={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box sx={icon3dStyle('linear-gradient(135deg, #10b981 0%, #059669 100%)', 'rgba(5,150,105,0.4)')}>
                <TaskAltOutlined sx={{ fontSize: 28 }} />
              </Box>
              <Chip
                size="small"
                label="Completed"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              />
            </Stack>
            <Typography variant="h3" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '-0.03em', mb: 0.5 }}>
              {statsLoading ? '…' : resolvedTicketsCount}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="#475569">
              Resolved & Verified
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Successful solutions implemented
            </Typography>
          </Box>
        </Box>

        {/* Card 4: Departments */}
        <Box sx={card3dStyle('#8b5cf6')}>
          <Box p={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box sx={icon3dStyle('linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', 'rgba(109,40,217,0.4)')}>
                <ApartmentOutlined sx={{ fontSize: 28 }} />
              </Box>
              <Chip
                size="small"
                label="Units"
                sx={{
                  bgcolor: 'rgba(139, 92, 246, 0.1)',
                  color: '#7c3aed',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}
              />
            </Stack>
            <Typography variant="h3" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '-0.03em', mb: 0.5 }}>
              {departments.length}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="#475569">
              Supported Departments
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Across Tancem Corporate & Plant locations
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 3. SLA PERFORMANCE & COMPLIANCE 3D COMMAND DECK */}
      <Box mb={3.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1.25}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                bgcolor: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37,99,235,0.4)',
              }}
            >
              <AccessTimeOutlined sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f172a">
                SLA Performance & Threshold Operations
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Live compliance countdown, threshold alerts, and breach escalation
              </Typography>
            </Box>
          </Box>
        </Stack>

        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={2.5}>
          {/* SLA Compliance Rate Card */}
          <Box sx={card3dStyle('#059669')}>
            <Box p={2.75}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="caption" fontWeight={700} sx={{ color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Compliance Index
                </Typography>
                <CheckCircleOutline sx={{ color: '#059669', fontSize: 20 }} />
              </Stack>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#059669', letterSpacing: '-0.02em', mb: 0.5 }}>
                {statsLoading ? '…' : `${stats?.complianceRate ?? 100}%`}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="#1e293b">
                Overall SLA Met
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Target SLA resolution: &gt; 95%
              </Typography>
            </Box>
          </Box>

          {/* Within SLA (Clickable to view) */}
          <Box component={RouterLink} to="/tickets?slaStatus=within_sla" sx={card3dStyle('#2563eb', true)}>
            <Box p={2.75}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="caption" fontWeight={700} sx={{ color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Within Deadline
                </Typography>
                <ArrowForward sx={{ color: '#2563eb', fontSize: 18 }} />
              </Stack>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#1e3a8a', letterSpacing: '-0.02em', mb: 0.5 }}>
                {statsLoading ? '…' : stats?.withinSla ?? 0}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="#1e293b">
                Safe & On Schedule
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click to inspect healthy tickets
              </Typography>
            </Box>
          </Box>

          {/* At Risk Alert Card (Clickable) */}
          <Box component={RouterLink} to="/tickets?slaStatus=at_risk" sx={card3dStyle('#d97706', true)}>
            <Box p={2.75}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#d97706', boxShadow: '0 0 8px #d97706' }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    At Risk (&lt; 2h left)
                  </Typography>
                </Stack>
                <WarningAmberOutlined sx={{ color: '#d97706', fontSize: 20 }} />
              </Stack>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#b45309', letterSpacing: '-0.02em', mb: 0.5 }}>
                {statsLoading ? '…' : stats?.atRisk ?? 0}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="#1e293b">
                Approaching Target
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Priority attention required
              </Typography>
            </Box>
          </Box>

          {/* Breached Alert Card (Clickable) */}
          <Box component={RouterLink} to="/tickets?slaStatus=breached" sx={card3dStyle('#dc2626', true)}>
            <Box p={2.75}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#dc2626', boxShadow: '0 0 8px #dc2626' }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    SLA Breached
                  </Typography>
                </Stack>
                <ErrorOutlineOutlined sx={{ color: '#dc2626', fontSize: 20 }} />
              </Stack>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#b91c1c', letterSpacing: '-0.02em', mb: 0.5 }}>
                {statsLoading ? '…' : stats?.breached ?? 0}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="#1e293b">
                Overdue / Escalated
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click to review breached tickets
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 4. 3D ANALYTICS CHARTS SECTION */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '1fr 1fr' }} gap={3} mb={3.5}>
        {/* Chart 1: 3D Donut - Status Distribution */}
        <Box sx={card3dStyle('#2563eb')}>
          <Box p={3.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#0f172a">
                  Tickets by Status
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Real-time lifecycle distribution across workflow stages
                </Typography>
              </Box>
              <Chip
                size="small"
                label="Workflow Stages"
                sx={{
                  bgcolor: '#eff6ff',
                  color: '#1d4ed8',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  border: '1px solid #bfdbfe',
                }}
              />
            </Stack>

            {statsLoading ? (
              <LoadingBlock />
            ) : statusChartData.length === 0 ? (
              <Box py={8} textAlign="center">
                <Typography color="text.secondary">No ticket status data available yet.</Typography>
              </Box>
            ) : (
              <Box height={300} position="relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="shadowPie" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.12" />
                      </filter>
                    </defs>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      filter="url(#shadowPie)"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value} tickets`, name]}
                      contentStyle={{
                        borderRadius: 12,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                        fontWeight: 600,
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Box>
        </Box>

        {/* Chart 2: 3D Bar Chart - Priority Urgency */}
        <Box sx={card3dStyle('#f97316')}>
          <Box p={3.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#0f172a">
                  Tickets by Urgency & Priority
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Workload volume grouped by service severity
                </Typography>
              </Box>
              <Chip
                size="small"
                label="Severity Matrix"
                sx={{
                  bgcolor: '#fff7ed',
                  color: '#c2410c',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  border: '1px solid #fed7aa',
                }}
              />
            </Stack>

            {statsLoading ? (
              <LoadingBlock />
            ) : (
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barUrgent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                        <stop offset="100%" stopColor="#991b1b" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="barHigh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                        <stop offset="100%" stopColor="#c2410c" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="barMedium" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="barLow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity={1} />
                        <stop offset="100%" stopColor="#475569" stopOpacity={0.85} />
                      </linearGradient>
                      <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} />
                    <Tooltip
                      formatter={(value: any) => [`${value} tickets`, 'Volume']}
                      contentStyle={{
                        borderRadius: 12,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} filter="url(#barShadow)">
                      {priorityChartData.map((entry, index) => {
                        const gradientMap: Record<string, string> = {
                          Urgent: 'url(#barUrgent)',
                          High: 'url(#barHigh)',
                          Medium: 'url(#barMedium)',
                          Low: 'url(#barLow)',
                        };
                        return <Cell key={`cell-priority-${index}`} fill={gradientMap[entry.name] || entry.color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* 5. TOP CATEGORIES & RECENT LIVE TICKETS (2 COLUMNS) */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '1fr 1fr' }} gap={3} mb={2}>
        {/* Category Breakdown */}
        <Box sx={card3dStyle('#8b5cf6')}>
          <Box p={3.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#0f172a">
                  Support Category Volume
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Breakdown by issue classification & support channel
                </Typography>
              </Box>
              <Chip
                size="small"
                label="Categories"
                sx={{
                  bgcolor: '#f5f3ff',
                  color: '#6d28d9',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  border: '1px solid #ddd6fe',
                }}
              />
            </Stack>

            {statsLoading ? (
              <LoadingBlock />
            ) : categoryChartData.length === 0 ? (
              <Box py={8} textAlign="center">
                <Typography color="text.secondary">No category data recorded yet.</Typography>
              </Box>
            ) : (
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical" margin={{ top: 10, right: 25, left: 35, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barCategory" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={{ stroke: 'rgba(0,0,0,0.1)' }} width={95} />
                    <Tooltip
                      formatter={(value: any) => [`${value} tickets`, 'Volume']}
                      contentStyle={{
                        borderRadius: 12,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="count" fill="url(#barCategory)" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Box>
        </Box>

        {/* Recent Live Tickets */}
        <Box sx={card3dStyle('#0ea5e9')}>
          <Box p={3.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#0f172a">
                  Recent Tickets Activity
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Latest support requests and real-time SLA countdowns
                </Typography>
              </Box>
              <Button
                component={RouterLink}
                to={paths.tickets}
                size="small"
                endIcon={<ArrowForward fontSize="small" />}
                sx={{ textTransform: 'none', fontWeight: 700, color: '#0284c7' }}
              >
                View all
              </Button>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {ticketLoading ? (
              <LoadingBlock />
            ) : ticketData?.items.length === 0 ? (
              <Box py={8} textAlign="center">
                <Typography color="text.secondary">No tickets recorded yet.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {ticketData?.items.slice(0, 5).map((t) => {
                  const statusStripeColor =
                    t.status === 'open'
                      ? '#3b82f6'
                      : t.status === 'in_progress'
                      ? '#f59e0b'
                      : t.status === 'resolved'
                      ? '#10b981'
                      : '#64748b';

                  return (
                    <Box
                      key={t.id}
                      component={RouterLink}
                      to={paths.tickets}
                      sx={{
                        position: 'relative',
                        p: 1.75,
                        pl: 2.25,
                        borderRadius: '14px',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        background: '#ffffff',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textDecoration: 'none',
                        color: 'inherit',
                        overflow: 'hidden',
                        transition: 'all 0.25s ease',
                        '&:before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          bgcolor: statusStripeColor,
                        },
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)',
                          borderColor: '#bfdbfe',
                        },
                      }}
                    >
                      <Box minWidth={0} mr={2}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.25}>
                          <Chip
                            size="small"
                            label={t.ticketNumber || 'TIC'}
                            sx={{
                              height: 20,
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              bgcolor: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                            }}
                          />
                          <Typography variant="body2" fontWeight={700} color="#0f172a" noWrap>
                            {t.title}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {t.category || 'General'} • {t.officeCategory ? `${t.officeCategory} • ` : ''}{formatDate(t.createdAt)}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                        <SlaBadge ticket={t} size="small" />
                        <Chip
                          size="small"
                          label={t.status.replace('_', ' ')}
                          color={
                            t.status === 'open'
                              ? 'info'
                              : t.status === 'in_progress'
                              ? 'warning'
                              : t.status === 'resolved'
                              ? 'success'
                              : 'default'
                          }
                          sx={{ textTransform: 'capitalize', fontSize: '0.7rem', fontWeight: 600 }}
                        />
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      </Box>

    </>
  );
}
