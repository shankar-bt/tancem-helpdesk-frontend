import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';
import HistoryIcon from '@mui/icons-material/History';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { paths } from '@/app/paths';
import { useDepartments } from '@/modules/core/departments/hooks/useDepartments';
import { useMasters } from '@/modules/core/masters/hooks/useMasters';
import { useRoles } from '@/modules/core/roles/hooks/useRoles';
import { ColumnHeaderPin, ExportButton, LoadingBlock, PageHeader, useColumnPinning, type ColumnPinConfig } from '@/shared/design-system';
import { useDebounce } from '@/shared/hooks';
import { usePermissions } from '@/shared/hooks';
import { PAGE_SIZE_OPTIONS } from '@/shared/utils/constants';
import { getErrorMessage } from '@/shared/utils/errors';
import { formatDate } from '@/shared/utils/format';
import { isUserAdmin, isUserAgent, isUserManager, type ExportColumn } from '@/shared/utils';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { ticketApi } from '../api/ticketApi';
import { useTickets } from '../hooks/useTickets';
import type { Ticket, TicketPriority, TicketStatus } from '../types';
import TicketDetailModal from './TicketDetailModal';
import SlaBadge from './SlaBadge';
import TicketHistoryModal from './TicketHistoryModal';


const TICKET_COLUMNS: ColumnPinConfig[] = [
  { id: 'sno', label: 'S.No', width: 64, defaultPin: 'none' },
  { id: 'ticketNumber', label: 'Ticket #', width: 160, defaultPin: 'none' },
  { id: 'category', label: 'Category', width: 140, defaultPin: 'none' },
  { id: 'supportCategory', label: 'Support Category', width: 155, defaultPin: 'none' },
  { id: 'issueCategory', label: 'Issue Category', width: 160, defaultPin: 'none' },
  { id: 'office', label: 'Office / Dept', width: 150, defaultPin: 'none' },
  { id: 'assigned', label: 'Assigned Agent', width: 150, defaultPin: 'none' },
  { id: 'priority', label: 'Priority', width: 105, defaultPin: 'none' },
  { id: 'status', label: 'Status', width: 110, defaultPin: 'none' },
  { id: 'sla', label: 'SLA', width: 120, defaultPin: 'none' },
  { id: 'created', label: 'Created', width: 105, defaultPin: 'none' },
  { id: 'action', label: 'Action', width: 125, defaultPin: 'right' },
];

const statusColors: Record<TicketStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  open: 'info',
  in_progress: 'warning',
  pending_approval: 'secondary',
  resolved: 'success',
  closed: 'default',
  reopened: 'error',
};

const priorityColors: Record<TicketPriority, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

const TICKET_EXPORT_COLUMNS: ExportColumn<Ticket>[] = [
  { header: 'S.No', key: 'sno', getValue: (_t, idx) => idx + 1 },
  {
    header: 'Ticket #',
    key: 'ticketNumber',
    getValue: (t) => t.ticketNumber || `TKT-${t.id.slice(0, 6).toUpperCase()}`,
  },
  { header: 'Title', key: 'title', getValue: (t) => t.title },
  { header: 'Description', key: 'description', getValue: (t) => t.description || '-' },
  { header: 'Category', key: 'category', getValue: (t) => t.category || '-' },
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
  { header: 'Created Date', key: 'createdAt', getValue: (t) => formatDate(t.createdAt) },
];

export default function TicketPage() {
  const currentUser = useAuthStore((s) => s.user);
  const { data: roles = [] } = useRoles();
  const { isAdmin: permAdmin, permissions: userPerms } = usePermissions();
  const isAdmin = permAdmin || isUserAdmin(currentUser, roles);
  const isManager = isUserManager(currentUser, roles);
  const notify = useNotificationStore((s) => s.notify);
  const isAgent = currentUser?.role === 'agent' || isUserAgent(currentUser, roles);

  const handleQuickClaim = async (ticketId: string) => {
    if (!currentUser) return;
    try {
      await ticketApi.assign(ticketId, { assignedToId: currentUser.id });
      notify('Ticket claimed successfully! You are now the assigned solver.', 'success');
      refetch();
    } catch (err) {
      notify(getErrorMessage(err), 'error');
    }
  };

  const canFilterDeptAndOffice = isAdmin || isManager;
  const { data: departments = [] } = useDepartments();
  const { data: officeCategories = [] } = useMasters('office_category');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput.trim());

  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [officeCategoryFilter, setOfficeCategoryFilter] = useState<string>('');
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Quick View Tabs & Date Range
  const [quickView, setQuickView] = useState<'all' | 'my' | 'unassigned' | 'at_risk'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [searchParams, setSearchParams] = useSearchParams();

  const { pins, setPin, getStickyStyles, isPinned } = useColumnPinning(
    'tickets_page',
    TICKET_COLUMNS
  );

  const initialSla = searchParams.get('slaStatus') as any;
  const [slaFilter, setSlaFilter] = useState<'all' | 'within_sla' | 'at_risk' | 'breached' | ''>(initialSla || '');

  useEffect(() => {
    if (currentUser) {
      if (isManager && !isAdmin) {
        if (currentUser.officeCategory) setOfficeCategoryFilter(currentUser.officeCategory);
        if (!filtersInitialized && currentUser.departmentId) {
          setDepartmentFilter(currentUser.departmentId);
        }
      } else if (!filtersInitialized && isAdmin) {
        if (currentUser.departmentId) setDepartmentFilter(currentUser.departmentId);
        if (currentUser.officeCategory) setOfficeCategoryFilter(currentUser.officeCategory);
      }
      setFiltersInitialized(true);
    }
  }, [currentUser, isManager, isAdmin, filtersInitialized]);

  const isOfficeFilterActive = isAdmin ? Boolean(officeCategoryFilter) : false;
  const hasActiveFilters = Boolean(
    searchInput ||
    statusFilter ||
    priorityFilter ||
    slaFilter ||
    departmentFilter ||
    isOfficeFilterActive ||
    quickView !== 'all' ||
    dateRange !== 'all'
  );

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setPriorityFilter('');
    setSlaFilter('');
    setQuickView('all');
    setDateRange('all');
    setSearchParams({});
    setDepartmentFilter('');
    if (isAdmin) {
      setOfficeCategoryFilter('');
    } else if (isManager && currentUser?.officeCategory) {
      setOfficeCategoryFilter(currentUser.officeCategory);
    }
    setPage(1);
  };

  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [historyTicketId, setHistoryTicketId] = useState<string | null>(null);
  const canCreate = isAdmin || userPerms.includes('tickets:create') || userPerms.includes('Create Ticket');

  const effectiveSlaStatus = quickView === 'at_risk' ? 'at_risk' : (slaFilter || undefined);

  const { data, isLoading, isFetching, error, refetch } = useTickets({
    page,
    limit,
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    slaStatus: effectiveSlaStatus as any,
    departmentId: departmentFilter || undefined,
    officeCategory: officeCategoryFilter || undefined,
    assignedToId: quickView === 'my' ? currentUser?.id : undefined,
    unassigned: quickView === 'unassigned' ? true : undefined,
    dateRange: dateRange !== 'all' ? dateRange : undefined,
  });

  const fetchExportTickets = async (): Promise<Ticket[]> => {
    if (!data?.meta?.total || data.items.length >= data.meta.total) {
      return data?.items || [];
    }
    const result = await ticketApi.list({
      page: 1,
      limit: Math.min(data.meta.total, 2000),
      search: search || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      slaStatus: effectiveSlaStatus as any,
      departmentId: departmentFilter || undefined,
      officeCategory: officeCategoryFilter || undefined,
      assignedToId: quickView === 'my' ? currentUser?.id : undefined,
      unassigned: quickView === 'unassigned' ? true : undefined,
      dateRange: dateRange !== 'all' ? dateRange : undefined,
    });
    return result.items || [];
  };

  return (
    <>
      <PageHeader
        title="Helpdesk Tickets"
        description="Monitor, assign, and resolve user support requests."
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              startIcon={
                <RestartAltIcon
                  sx={{
                    animation: isFetching ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              }
              onClick={() => refetch()}
              disabled={isFetching}
              sx={{ textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.primary' }}
            >
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </Button>
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={RouterLink}
                to={paths.createTicket}
              >
                Raise Ticket
              </Button>
            )}
          </Stack>
        }
      />

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Quick View Segmented Tabs */}
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
          <Tabs
            value={quickView}
            onChange={(_e, val) => {
              setQuickView(val);
              setPage(1);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                minHeight: 48,
                py: 1,
                px: 2.5,
              },
            }}
          >
            <Tab label="All Tickets" value="all" />
            <Tab
              icon={<SupportAgentIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Assigned to Me"
              value="my"
            />
            <Tab
              label="Unassigned"
              value="unassigned"
              icon={
                <Chip
                  label="Queue"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: '#fef3c7',
                    color: '#b45309',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                />
              }
              iconPosition="end"
            />
            <Tab
              label="At Risk / Breached"
              value="at_risk"
              icon={
                <Chip
                  label="SLA"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: '#fee2e2',
                    color: '#991b1b',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                />
              }
              iconPosition="end"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#ffffff' }}>
          {/* Top row: Prominent Search + Reset Action */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
            mb={2}
          >
            <TextField
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search tickets by title, ticket #, or description..."
              size="small"
              fullWidth
              sx={{ maxWidth: { sm: 460 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchInput('')} edge="end">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
                htmlInput: { 'aria-label': 'Search tickets' },
              }}
            />

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              {hasActiveFilters && (
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<RestartAltIcon fontSize="small" />}
                  onClick={handleResetFilters}
                  sx={{
                    borderColor: 'divider',
                    color: 'text.secondary',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.8125rem',
                    height: 38,
                    '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' },
                  }}
                >
                  Reset Filters
                </Button>
              )}

              <ExportButton
                data={fetchExportTickets}
                columns={TICKET_EXPORT_COLUMNS}
                filename="tancem_tickets"
                title="TANCEM Helpdesk - Tickets Report"
                subtitle={`Total matching records: ${data?.meta?.total ?? data?.items?.length ?? 0}`}
                disabled={isLoading || (data?.items?.length === 0)}
              />
            </Stack>
          </Stack>

          {/* Filter Dropdowns Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: canFilterDeptAndOffice ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                lg: canFilterDeptAndOffice ? 'repeat(6, 1fr)' : 'repeat(4, 1fr)',
              },
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            {canFilterDeptAndOffice && (
              <TextField
                select
                size="small"
                label="Office Category"
                value={officeCategoryFilter}
                disabled={isManager && !isAdmin}
                onChange={(e) => {
                  setOfficeCategoryFilter(e.target.value);
                  setPage(1);
                }}
                slotProps={{
                  input: isManager && !isAdmin
                    ? {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Tooltip title="Fixed to your assigned office location">
                            <LockOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }
                    : undefined,
                }}
                helperText={isManager && !isAdmin ? 'Assigned office (view only)' : undefined}
                FormHelperTextProps={{ sx: { mx: 0.5, mt: 0.25, fontSize: '0.7rem' } }}
              >
                {isAdmin && <MenuItem value="">All Office Categories</MenuItem>}
                {officeCategories.map((oc) => (
                  <MenuItem key={oc.id} value={oc.name}>
                    {oc.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {canFilterDeptAndOffice && (
              <TextField
                select
                size="small"
                label="Department"
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as TicketStatus | '');
                setPage(1);
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="pending_approval">Pending</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Priority"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value as TicketPriority | '');
                setPage(1);
              }}
            >
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="SLA Status"
              value={slaFilter}
              onChange={(e) => {
                const val = e.target.value as any;
                setSlaFilter(val);
                setPage(1);
                if (val) setSearchParams({ slaStatus: val });
                else setSearchParams({});
              }}
            >
              <MenuItem value="">All SLA</MenuItem>
              <MenuItem value="within_sla">Within SLA</MenuItem>
              <MenuItem value="at_risk">At Risk</MenuItem>
              <MenuItem value="breached">Breached</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Date Range"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as any);
                setPage(1);
              }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </TextField>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
            {getErrorMessage(error)}
          </Alert>
        )}

        {isLoading ? (
          <LoadingBlock />
        ) : (
          <TableContainer sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 120ms', maxHeight: 'calc(100vh - 280px)' }}>
            <Table size="medium" stickyHeader sx={{ minWidth: 1350 }}>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#f8fafc', py: 1.5, borderBottom: '1px solid #e2e8f0' } }}>
                  <TableCell
                    align="center"
                    className={isPinned('sno') ? 'sticky-pinned-cell' : undefined}
                    sx={{ width: 64, minWidth: 64, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('sno', true) }}
                  >
                    <ColumnHeaderPin columnId="sno" title="S.No" direction={pins['sno']} onPinChange={setPin} align="center">
                      S.NO
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('ticketNumber') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 160, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('ticketNumber', true) }}
                  >
                    <ColumnHeaderPin columnId="ticketNumber" title="Ticket #" direction={pins['ticketNumber']} onPinChange={setPin}>
                      TICKET #
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('category') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 140, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('category', true) }}
                  >
                    <ColumnHeaderPin columnId="category" title="Category" direction={pins['category']} onPinChange={setPin}>
                      CATEGORY
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('supportCategory') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 155, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('supportCategory', true) }}
                  >
                    <ColumnHeaderPin columnId="supportCategory" title="Support Category" direction={pins['supportCategory']} onPinChange={setPin}>
                      SUPPORT CATEGORY
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('issueCategory') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 160, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('issueCategory', true) }}
                  >
                    <ColumnHeaderPin columnId="issueCategory" title="Issue Category" direction={pins['issueCategory']} onPinChange={setPin}>
                      ISSUE CATEGORY
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('office') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 150, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('office', true) }}
                  >
                    <ColumnHeaderPin columnId="office" title="Office / Dept" direction={pins['office']} onPinChange={setPin}>
                      OFFICE / DEPT
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('assigned') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 150, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('assigned', true) }}
                  >
                    <ColumnHeaderPin columnId="assigned" title="Assigned Agent" direction={pins['assigned']} onPinChange={setPin}>
                      ASSIGNED AGENT
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    align="center"
                    className={isPinned('priority') ? 'sticky-pinned-cell' : undefined}
                    sx={{ width: 105, minWidth: 105, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('priority', true) }}
                  >
                    <ColumnHeaderPin columnId="priority" title="Priority" direction={pins['priority']} onPinChange={setPin} align="center">
                      PRIORITY
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    align="center"
                    className={isPinned('status') ? 'sticky-pinned-cell' : undefined}
                    sx={{ width: 110, minWidth: 110, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('status', true) }}
                  >
                    <ColumnHeaderPin columnId="status" title="Status" direction={pins['status']} onPinChange={setPin} align="center">
                      STATUS
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    align="center"
                    className={isPinned('sla') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 120, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('sla', true) }}
                  >
                    <ColumnHeaderPin columnId="sla" title="SLA" direction={pins['sla']} onPinChange={setPin} align="center">
                      SLA
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('created') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 105, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('created', true) }}
                  >
                    <ColumnHeaderPin columnId="created" title="Created" direction={pins['created']} onPinChange={setPin}>
                      CREATED
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    align="center"
                    className={isPinned('action') ? 'sticky-pinned-cell' : undefined}
                    sx={{
                      fontWeight: 700,
                      color: '#475569',
                      fontSize: '0.75rem',
                      letterSpacing: '0.04em',
                      width: 125,
                      minWidth: 125,
                      ...getStickyStyles('action', true),
                    }}
                  >
                    <ColumnHeaderPin columnId="action" title="Action" direction={pins['action']} onPinChange={setPin} align="center">
                      ACTION
                    </ColumnHeaderPin>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {search ? `No tickets match “${search}”.` : 'No tickets recorded yet.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {data?.items.map((t, idx) => {
                  const isClosedOrResolved = t.status === 'resolved' || t.status === 'closed';
                  const isBreached = !isClosedOrResolved && (t.slaBreached || t.slaStatus === 'breached');
                  const isAtRisk = !isClosedOrResolved && !isBreached && t.slaStatus === 'at_risk';

                  return (
                    <TableRow
                      key={t.id}
                      hover
                      sx={{
                        bgcolor: isBreached
                          ? 'rgba(239, 68, 68, 0.02)'
                          : isAtRisk
                          ? 'rgba(245, 158, 11, 0.02)'
                          : undefined,
                        '& td': { py: 1.5, verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9' },
                        '&:hover .sticky-pinned-cell': { bgcolor: '#f8fafc' },
                      }}
                    >
                      <TableCell
                        align="center"
                        className={isPinned('sno') ? 'sticky-pinned-cell' : undefined}
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                          fontSize: '0.8125rem',
                          borderLeft: isBreached
                            ? '4px solid #ef4444'
                            : isAtRisk
                            ? '4px solid #f59e0b'
                            : '4px solid transparent',
                          ...getStickyStyles('sno', false),
                        }}
                      >
                        {(page - 1) * limit + idx + 1}
                      </TableCell>
                    <TableCell
                      className={isPinned('ticketNumber') ? 'sticky-pinned-cell' : undefined}
                      sx={{ whiteSpace: 'nowrap', ...getStickyStyles('ticketNumber', false) }}
                    >
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'primary.main',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            fontSize: '0.8125rem',
                          }}
                        >
                          {t.ticketNumber || `TKT-${t.id.slice(0, 6).toUpperCase()}`}
                        </Typography>
                        {t.attachments && t.attachments.length > 0 && (
                          <Tooltip title={`${t.attachments.length} attachment(s)`} arrow>
                            <AttachFileIcon sx={{ fontSize: 13, color: '#64748b' }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell
                      className={isPinned('category') ? 'sticky-pinned-cell' : undefined}
                      sx={{ ...getStickyStyles('category', false) }}
                    >
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, fontSize: '0.8125rem' }}>
                        {t.category || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell
                      className={isPinned('supportCategory') ? 'sticky-pinned-cell' : undefined}
                      sx={{ ...getStickyStyles('supportCategory', false) }}
                    >
                      <Chip
                        size="small"
                        label={t.supportCategory || t.category || '—'}
                        sx={{
                          bgcolor: '#f1f5f9',
                          color: '#334155',
                          fontSize: '0.72rem',
                          height: 22,
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell
                      className={isPinned('issueCategory') ? 'sticky-pinned-cell' : undefined}
                      sx={{ ...getStickyStyles('issueCategory', false) }}
                    >
                      <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500, fontSize: '0.8125rem' }}>
                        {t.issueCategory || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell
                      className={isPinned('office') ? 'sticky-pinned-cell' : undefined}
                      sx={{ ...getStickyStyles('office', false) }}
                    >
                      <Stack spacing={0.5} alignItems="flex-start">
                        {t.officeCategory && (
                          <Chip
                            size="small"
                            label={t.officeCategory}
                            sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontSize: '0.72rem', height: 20, fontWeight: 500 }}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {t.department?.name || '—'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell
                      className={isPinned('assigned') ? 'sticky-pinned-cell' : undefined}
                      sx={{ ...getStickyStyles('assigned', false) }}
                    >
                      {t.assignedTo ? (
                        <Chip
                          icon={<SupportAgentIcon sx={{ fontSize: '1rem !important' }} />}
                          label={t.assignedTo.name}
                          size="small"
                          sx={{
                            bgcolor: '#ede9fe',
                            color: '#5b21b6',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                          }}
                        />
                      ) : (
                        <Chip
                          label="Unassigned"
                          size="small"
                          variant="outlined"
                          sx={{
                            color: '#94a3b8',
                            borderColor: '#cbd5e1',
                            fontSize: '0.72rem',
                            height: 22,
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell
                      align="center"
                      className={isPinned('priority') ? 'sticky-pinned-cell' : undefined}
                      sx={{ ...getStickyStyles('priority', false) }}
                    >
                      <Chip
                        size="small"
                        label={t.priority}
                        color={priorityColors[t.priority] || 'default'}
                        variant="outlined"
                        sx={{ textTransform: 'capitalize', fontWeight: 600, minWidth: 70 }}
                      />
                    </TableCell>
                    <TableCell
                      align="center"
                      className={isPinned('status') ? 'sticky-pinned-cell' : undefined}
                      sx={{ ...getStickyStyles('status', false) }}
                    >
                      <Chip
                        size="small"
                        label={t.status.replace('_', ' ')}
                        color={statusColors[t.status] || 'default'}
                        sx={{ fontWeight: 600, textTransform: 'capitalize', minWidth: 80 }}
                      />
                    </TableCell>
                    <TableCell
                      align="center"
                      className={isPinned('sla') ? 'sticky-pinned-cell' : undefined}
                      sx={{ ...getStickyStyles('sla', false) }}
                    >
                      <SlaBadge ticket={t} />
                    </TableCell>
                    <TableCell
                      className={isPinned('created') ? 'sticky-pinned-cell' : undefined}
                      sx={{ whiteSpace: 'nowrap', ...getStickyStyles('created', false) }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(t.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      className={isPinned('action') ? 'sticky-pinned-cell' : undefined}
                      sx={{
                        whiteSpace: 'nowrap',
                        ...getStickyStyles('action', false),
                      }}
                    >
                      <Stack direction="row" spacing={0.75} justifyContent="center" alignItems="center">
                        {!t.assignedToId && (isAgent || isAdmin) && (
                          <Tooltip title="Quick Claim: Assign this ticket to yourself" arrow>
                            <Button
                              size="small"
                              variant="contained"
                              color="secondary"
                              onClick={() => handleQuickClaim(t.id)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                borderRadius: 1.5,
                                px: 1.25,
                                py: 0.4,
                              }}
                            >
                              Claim
                            </Button>
                          </Tooltip>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setDetailTicketId(t.id)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            borderRadius: 1.5,
                            px: 1.25,
                            borderColor: 'divider',
                            color: '#0f172a',
                            '&:hover': { bgcolor: '#eff6ff', borderColor: '#2563eb', color: '#2563eb' },
                          }}
                        >
                          View Details
                        </Button>
                        <Tooltip title="View Ticket History & Audit Trail" arrow>
                          <IconButton
                            size="small"
                            onClick={() => setHistoryTicketId(t.id)}
                            sx={{
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              borderRadius: 1.5,
                              p: 0.6,
                              bgcolor: '#ffffff',
                              '&:hover': { bgcolor: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' },
                            }}
                          >
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component="div"
          count={data?.meta.total ?? 0}
          page={page - 1}
          rowsPerPage={limit}
          rowsPerPageOptions={[...PAGE_SIZE_OPTIONS]}
          onPageChange={(_, p) => setPage(p + 1)}
          onRowsPerPageChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
        />
      </Paper>

      <TicketDetailModal
        open={Boolean(detailTicketId)}
        ticketId={detailTicketId}
        onClose={() => setDetailTicketId(null)}
        onUpdated={() => void refetch()}
      />

      <TicketHistoryModal
        open={Boolean(historyTicketId)}
        ticketId={historyTicketId}
        onClose={() => setHistoryTicketId(null)}
      />
    </>
  );
}
