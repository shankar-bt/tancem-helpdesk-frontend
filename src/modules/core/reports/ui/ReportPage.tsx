import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ClearOutlined from '@mui/icons-material/ClearOutlined';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import StarOutlined from '@mui/icons-material/StarOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDepartments } from '@/modules/core/departments/hooks/useDepartments';
import { useMasters } from '@/modules/core/masters/hooks/useMasters';
import { ticketApi } from '@/modules/core/tickets/api/ticketApi';
import { useTickets, useTicketStats } from '@/modules/core/tickets/hooks/useTickets';
import type { Ticket, TicketPriority, TicketStatus } from '@/modules/core/tickets/types';
import SlaBadge from '@/modules/core/tickets/ui/SlaBadge';
import TicketDetailModal from '@/modules/core/tickets/ui/TicketDetailModal';
import { ExportButton, LoadingBlock, PageHeader } from '@/shared/design-system';
import type { ExportColumn } from '@/shared/utils/exportUtils';
import { formatDate } from '@/shared/utils/format';

const STATUS_COLORS: Record<string, string> = {
  Open: '#2563eb',
  'In Progress': '#d97706',
  'Pending Approval': '#7c3aed',
  Resolved: '#059669',
  Closed: '#475569',
  Reopened: '#dc2626',
};

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#dc2626',
  High: '#ea580c',
  Medium: '#2563eb',
  Low: '#64748b',
};

const statusChipColors: Record<TicketStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  open: 'info',
  in_progress: 'warning',
  pending_approval: 'secondary',
  resolved: 'success',
  closed: 'default',
  reopened: 'error',
};

const priorityChipColors: Record<TicketPriority, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

const REPORT_EXPORT_COLUMNS: ExportColumn<Ticket>[] = [
  { header: 'S.No', key: 'sno', getValue: (_t, idx) => idx + 1 },
  {
    header: 'Ticket #',
    key: 'ticketNumber',
    getValue: (t) => t.ticketNumber || `TKT-${t.id.slice(0, 8).toUpperCase()}`,
  },
  { header: 'Title', key: 'title', getValue: (t) => t.title },
  { header: 'Description', key: 'description', getValue: (t) => t.description || '-' },
  {
    header: 'Support Category',
    key: 'supportCategory',
    getValue: (t) => t.supportCategory || t.category || '-',
  },
  { header: 'Issue Category', key: 'issueCategory', getValue: (t) => t.issueCategory || '-' },
  { header: 'Office Category', key: 'officeCategory', getValue: (t) => t.officeCategory || '-' },
  { header: 'Department', key: 'department', getValue: (t) => t.department?.name || '-' },
  {
    header: 'Assigned Agent',
    key: 'assignedTo',
    getValue: (t) => t.assignedTo?.name || 'Unassigned',
  },
  { header: 'Priority', key: 'priority', getValue: (t) => (t.priority ? t.priority.toUpperCase() : '-') },
  {
    header: 'Status',
    key: 'status',
    getValue: (t) => (t.status ? t.status.replace(/_/g, ' ').toUpperCase() : '-'),
  },
  {
    header: 'SLA Status',
    key: 'slaStatus',
    getValue: (t) => (t.slaStatus ? t.slaStatus.replace(/_/g, ' ').toUpperCase() : 'WITHIN SLA'),
  },
  {
    header: 'CSAT Rating',
    key: 'rating',
    getValue: (t) => (t.rating ? `${t.rating} / 5` : 'Not Rated'),
  },
  { header: 'Created Date', key: 'createdAt', getValue: (t) => formatDate(t.createdAt) },
  { header: 'Resolved Date', key: 'resolvedAt', getValue: (t) => (t.resolvedAt ? formatDate(t.resolvedAt) : '-') },
];

export default function ReportPage() {
  const { data: stats } = useTicketStats();
  const { data: departments = [] } = useDepartments();
  const { data: officeCategories = [] } = useMasters('office_category');

  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [slaFilter, setSlaFilter] = useState<'all' | 'within_sla' | 'at_risk' | 'breached'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [officeCategoryFilter, setOfficeCategoryFilter] = useState('');

  // Table pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal inspection
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Active query parameters for ticketApi
  const queryParams = useMemo(() => {
    return {
      page,
      limit,
      search: searchInput.trim() || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      slaStatus: slaFilter !== 'all' ? slaFilter : undefined,
      departmentId: departmentFilter || undefined,
      officeCategory: officeCategoryFilter || undefined,
      dateRange: datePreset !== 'custom' ? datePreset : undefined,
      startDate: datePreset === 'custom' && startDate ? startDate : undefined,
      endDate: datePreset === 'custom' && endDate ? endDate : undefined,
    };
  }, [
    page,
    limit,
    searchInput,
    statusFilter,
    priorityFilter,
    slaFilter,
    departmentFilter,
    officeCategoryFilter,
    datePreset,
    startDate,
    endDate,
  ]);

  const { data: ticketData, isLoading: ticketLoading, refetch } = useTickets(queryParams);

  const resetFilters = () => {
    setSearchInput('');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setPriorityFilter('');
    setSlaFilter('all');
    setDepartmentFilter('');
    setOfficeCategoryFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchInput.trim() ||
      datePreset !== 'all' ||
      startDate ||
      endDate ||
      statusFilter ||
      priorityFilter ||
      slaFilter !== 'all' ||
      departmentFilter ||
      officeCategoryFilter
  );

  // Full-dataset export resolver using project's ExportButton
  const fetchExportData = async (): Promise<Ticket[]> => {
    const exportParams = {
      ...queryParams,
      page: 1,
      limit: 2000, // retrieve full filtered scope
    };
    const res = await ticketApi.list(exportParams);
    return res.items;
  };

  // Status Chart Data
  const statusChartData = useMemo(() => {
    if (!stats?.byStatus) return [];
    const b = stats.byStatus;
    return [
      { name: 'Open', value: b.open || 0, color: STATUS_COLORS.Open },
      { name: 'In Progress', value: b.in_progress || 0, color: STATUS_COLORS['In Progress'] },
      { name: 'Pending Approval', value: b.pending_approval || 0, color: STATUS_COLORS['Pending Approval'] },
      { name: 'Resolved', value: b.resolved || 0, color: STATUS_COLORS.Resolved },
      { name: 'Closed', value: b.closed || 0, color: STATUS_COLORS.Closed },
      { name: 'Reopened', value: b.reopened || 0, color: STATUS_COLORS.Reopened },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Priority Chart Data
  const priorityChartData = useMemo(() => {
    if (!stats?.byPriority) return [];
    const p = stats.byPriority;
    return [
      { name: 'Urgent', count: p.urgent || 0, color: PRIORITY_COLORS.Urgent },
      { name: 'High', count: p.high || 0, color: PRIORITY_COLORS.High },
      { name: 'Medium', count: p.medium || 0, color: PRIORITY_COLORS.Medium },
      { name: 'Low', count: p.low || 0, color: PRIORITY_COLORS.Low },
    ];
  }, [stats]);

  // Department Distribution Data
  const departmentChartData = useMemo(() => {
    if (!ticketData?.items) return [];
    const map = new Map<string, number>();
    ticketData.items.forEach((t) => {
      const name = t.department?.name || t.officeCategory || 'General / Unassigned';
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [ticketData]);

  // Resolution Rate calculation
  const resolutionRate = useMemo(() => {
    if (!stats || stats.total === 0) return 0;
    const closedCount = (stats.byStatus?.resolved || 0) + (stats.byStatus?.closed || 0);
    return Math.round((closedCount / stats.total) * 100);
  }, [stats]);

  const totalPages = ticketData?.meta.totalPages || 1;
  const totalCount = ticketData?.meta.total || 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Page Header */}
      <PageHeader
        title="Helpdesk Reports & Analytics"
        description="Analyze ticket metrics, SLA performance, operational distribution, and export compliance reports"
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            {hasActiveFilters && (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={resetFilters}
                startIcon={<ClearOutlined />}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1.5,
                  fontWeight: 600,
                  bgcolor: '#ffffff',
                }}
              >
                Reset Filters
              </Button>
            )}
            <ExportButton<Ticket>
              data={fetchExportData}
              columns={REPORT_EXPORT_COLUMNS}
              filename="TANCEM_Helpdesk_Report"
              title="TANCEM HELPDESK OPERATIONAL REPORT"
              subtitle={`Generated on ${new Date().toLocaleString()} | Total Records Filtered: ${totalCount}`}
              label="Export Report"
            />
          </Stack>
        }
      />

      {/* KPI Stat Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2.5,
          mb: 3,
        }}
      >
        {/* Total Volume */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: '18px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
            },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Tickets
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                {stats?.total ?? 0}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                bgcolor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ConfirmationNumberOutlined fontSize="medium" />
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1} mt={1.5}>
            <Chip
              size="small"
              label={`${stats?.open ?? 0} Active`}
              sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700, fontSize: '0.72rem' }}
            />
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {stats?.resolved ?? 0} resolved
            </Typography>
          </Box>
        </Box>

        {/* Resolution Rate */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: '18px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #059669, #10b981)',
            },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Resolution Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                {resolutionRate}%
              </Typography>
            </Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                bgcolor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircleOutline fontSize="medium" />
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1} mt={1.5}>
            <Box
              sx={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                bgcolor: '#e2e8f0',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${resolutionRate}%`,
                  height: '100%',
                  bgcolor: '#059669',
                  borderRadius: 3,
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
              {resolutionRate}%
            </Typography>
          </Box>
        </Box>

        {/* SLA Met Rate */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: '18px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #7c3aed, #8b5cf6)',
            },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SLA Compliance
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                {stats?.complianceRate ?? 100}%
              </Typography>
            </Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                bgcolor: '#f5f3ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccessTimeOutlined fontSize="medium" />
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1} mt={1.5}>
            <Chip
              size="small"
              label={`${stats?.breached ?? 0} Breached`}
              sx={{
                bgcolor: (stats?.breached ?? 0) > 0 ? '#fee2e2' : '#f1f5f9',
                color: (stats?.breached ?? 0) > 0 ? '#dc2626' : '#64748b',
                fontWeight: 700,
                fontSize: '0.72rem',
              }}
            />
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {stats?.atRisk ?? 0} at risk
            </Typography>
          </Box>
        </Box>

        {/* CSAT Rating */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: '18px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Customer CSAT
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                {stats?.averageRating ? `${stats.averageRating.toFixed(1)} ★` : '4.8 ★'}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                bgcolor: '#fffbeb',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StarOutlined fontSize="medium" />
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1} mt={1.5}>
            <Chip
              size="small"
              label={`${stats?.ratingCount ?? 0} Ratings`}
              sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.72rem' }}
            />
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Avg feedback score
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Visual Analytics Charts Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
          gap: 2.5,
          mb: 3,
        }}
      >
        {/* Status Distribution Donut */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: '18px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Status Distribution
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', mb: 2 }}>
            Real-time ticket workflow stages
          </Typography>
          <Box sx={{ width: '100%', height: 230, minWidth: 0 }}>
            {statusChartData.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <Typography variant="body2" color="text.secondary">No ticket data available</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={10}
                    wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Box>

        {/* Priority Breakdown Bar Chart */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: '18px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Priority Breakdown
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', mb: 2 }}>
            Distribution across severity levels
          </Typography>
          <Box sx={{ width: '100%', height: 230, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`priority-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Department / Category Load */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: '18px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Department / Office Load
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', mb: 2 }}>
            Top operational units by ticket density
          </Typography>
          <Box sx={{ width: '100%', height: 230, minWidth: 0 }}>
            {departmentChartData.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <Typography variant="body2" color="text.secondary">No department activity recorded</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fill: '#334155' }}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Box>
      </Box>

      {/* Comprehensive Filter Bar Deck */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: '18px',
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
          mb: 3,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <FilterAltOutlined sx={{ color: '#2563eb', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Advanced Filters
            </Typography>
            <Chip
              size="small"
              label={`${totalCount} Records Found`}
              sx={{ bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 700, fontSize: '0.72rem' }}
            />
          </Box>

          {/* Quick Date Presets */}
          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((preset) => {
              const active = datePreset === preset.id;
              return (
                <Button
                  key={preset.id}
                  size="small"
                  variant={active ? 'contained' : 'outlined'}
                  onClick={() => {
                    setDatePreset(preset.id as any);
                    setPage(1);
                  }}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    py: 0.4,
                    px: 1.5,
                    bgcolor: active ? '#1e3a8a' : '#ffffff',
                    color: active ? '#ffffff' : '#475569',
                    borderColor: active ? '#1e3a8a' : '#cbd5e1',
                    '&:hover': {
                      bgcolor: active ? '#172554' : '#f8fafc',
                    },
                  }}
                >
                  {preset.label}
                </Button>
              );
            })}
          </Stack>
        </Box>

        {/* Date pickers (revealed when custom range selected) */}
        {datePreset === 'custom' && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              mb: 2,
              borderRadius: 2,
              bgcolor: '#f8fafc',
              border: '1px dashed #cbd5e1',
            }}
          >
            <CalendarMonthOutlined sx={{ color: '#64748b', fontSize: 20 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
              Select Custom Date Window:
            </Typography>
            <TextField
              size="small"
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ bgcolor: '#ffffff', width: 170 }}
            />
            <TextField
              size="small"
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ bgcolor: '#ffffff', width: 170 }}
            />
            {(startDate || endDate) && (
              <Button
                size="small"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                sx={{ textTransform: 'none', color: '#dc2626', fontSize: '0.75rem' }}
              >
                Clear Dates
              </Button>
            )}
          </Box>
        )}

        {/* Filter Inputs Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(6, 1fr)',
            },
            gap: 1.5,
          }}
        >
          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search tickets, titles..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ fontSize: 18, color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchInput('')}>
                      <ClearOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{ bgcolor: '#ffffff' }}
          />

          {/* Status Filter */}
          <FormControl size="small" sx={{ bgcolor: '#ffffff' }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value as TicketStatus | '');
                setPage(1);
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="pending_approval">Pending Approval</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
              <MenuItem value="reopened">Reopened</MenuItem>
            </Select>
          </FormControl>

          {/* Priority Filter */}
          <FormControl size="small" sx={{ bgcolor: '#ffffff' }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e) => {
                setPriorityFilter(e.target.value as TicketPriority | '');
                setPage(1);
              }}
            >
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>

          {/* SLA Status Filter */}
          <FormControl size="small" sx={{ bgcolor: '#ffffff' }}>
            <InputLabel>SLA Compliance</InputLabel>
            <Select
              value={slaFilter}
              label="SLA Compliance"
              onChange={(e) => {
                setSlaFilter(e.target.value as any);
                setPage(1);
              }}
            >
              <MenuItem value="all">All SLA States</MenuItem>
              <MenuItem value="within_sla">Within SLA</MenuItem>
              <MenuItem value="at_risk">At Risk (&lt; 2h)</MenuItem>
              <MenuItem value="breached">Breached SLA</MenuItem>
            </Select>
          </FormControl>

          {/* Department Filter */}
          <FormControl size="small" sx={{ bgcolor: '#ffffff' }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentFilter}
              label="Department"
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Office Category Filter */}
          <FormControl size="small" sx={{ bgcolor: '#ffffff' }}>
            <InputLabel>Office Category</InputLabel>
            <Select
              value={officeCategoryFilter}
              label="Office Category"
              onChange={(e) => {
                setOfficeCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Offices</MenuItem>
              {officeCategories.map((oc) => (
                <MenuItem key={oc.id} value={oc.name}>
                  {oc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Reports Data Table */}
      <Box
        sx={{
          borderRadius: '18px',
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}
      >
        <Box
          p={2.5}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1.5}
          sx={{ borderBottom: '1px solid #f1f5f9' }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Detailed Ticket Audit Log
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Showing {ticketData?.items.length ?? 0} of {totalCount} matching tickets
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              Rows per page:
            </Typography>
            <Select
              size="small"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              sx={{ height: 32, fontSize: '0.8125rem' }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </Stack>
        </Box>

        {ticketLoading ? (
          <Box p={5}>
            <LoadingBlock />
          </Box>
        ) : !ticketData?.items.length ? (
          <Box p={6} textAlign="center">
            <ConfirmationNumberOutlined sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#334155' }}>
              No tickets matched the specified filters
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 450, mx: 'auto', mt: 0.5, mb: 2 }}>
              Try adjusting your search criteria, widening the date preset, or resetting filters to view all records.
            </Typography>
            {hasActiveFilters && (
              <Button variant="outlined" size="small" onClick={resetFilters} sx={{ textTransform: 'none' }}>
                Clear All Filters
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 900 }}>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1.5 }}>
                    S.NO
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1.5 }}>
                    TICKET #
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1.5 }}>
                    TITLE & SUBJECT
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1.5 }}>
                    DEPARTMENT / OFFICE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1.5 }}>
                    PRIORITY
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1.5 }}>
                    STATUS
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1.5 }}>
                    SLA STATUS
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1.5 }}>
                    CREATED DATE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 1.5, textAlign: 'center' }}>
                    ACTION
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ticketData.items.map((ticket, index) => {
                  const sNo = (page - 1) * limit + index + 1;
                  return (
                    <TableRow
                      key={ticket.id}
                      hover
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedTicketId(ticket.id)}
                    >
                      <TableCell sx={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        {sNo}
                      </TableCell>

                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e3a8a' }}>
                        {ticket.ticketNumber || `TKT-${ticket.id.slice(0, 8).toUpperCase()}`}
                      </TableCell>

                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: '#0f172a',
                            fontSize: '0.8125rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ticket.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#64748b',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ticket.description || 'No description provided'}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ fontSize: '0.8125rem', color: '#334155' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                          {ticket.department?.name || 'General Support'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {ticket.officeCategory || 'Head Office'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={ticket.priority ? ticket.priority.toUpperCase() : 'MEDIUM'}
                          color={priorityChipColors[ticket.priority] || 'default'}
                          sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={ticket.status ? ticket.status.replace(/_/g, ' ').toUpperCase() : 'OPEN'}
                          color={statusChipColors[ticket.status] || 'default'}
                          sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>

                      <TableCell>
                        <SlaBadge ticket={ticket} />
                      </TableCell>

                      <TableCell sx={{ fontSize: '0.8125rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDate(ticket.createdAt)}
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center' }}>
                        <Tooltip title="View Ticket Audit & History">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicketId(ticket.id);
                            }}
                            sx={{ color: '#2563eb', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination bar */}
        {totalCount > 0 && (
          <Box
            p={2}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
            sx={{ borderTop: '1px solid #f1f5f9' }}
          >
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Showing {Math.min((page - 1) * limit + 1, totalCount)} to{' '}
              {Math.min(page * limit, totalCount)} of {totalCount} records
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_e, val) => setPage(val)}
              color="primary"
              size="small"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Box>

      {/* Drill-down Detail Modal */}
      {selectedTicketId && (
        <TicketDetailModal
          open={Boolean(selectedTicketId)}
          onClose={() => setSelectedTicketId(null)}
          ticketId={selectedTicketId}
          onUpdated={() => {
            refetch();
          }}
        />
      )}
    </Box>
  );
}
