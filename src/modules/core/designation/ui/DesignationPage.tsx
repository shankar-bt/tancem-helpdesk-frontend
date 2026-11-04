import AddIcon from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useRoles } from '@/modules/core/roles/hooks/useRoles';
import { ConfirmDialog, ColumnHeaderPin, LoadingBlock, PageHeader, useColumnPinning, type ColumnPinConfig } from '@/shared/design-system';
import { useDebounce } from '@/shared/hooks';
import { isUserAdmin } from '@/shared/utils';
import { PAGE_SIZE_OPTIONS } from '@/shared/utils/constants';
import { getErrorMessage } from '@/shared/utils/errors';
import { formatDate } from '@/shared/utils/format';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useDeleteDesignation, useDesignations } from '../hooks/useDesignation';
import type { Designation } from '../types';
import DesignationFormModal from './DesignationFormModal';

const DESIGNATION_COLUMNS: ColumnPinConfig[] = [
  { id: 'sno', label: 'S.No', width: 64, defaultPin: 'none' },
  { id: 'code', label: 'Code', width: 110, defaultPin: 'none' },
  { id: 'title', label: 'Title', width: 220, defaultPin: 'none' },
  { id: 'role', label: 'Access Role', width: 190, defaultPin: 'none' },
  { id: 'status', label: 'Status', width: 110, defaultPin: 'none' },
  { id: 'created', label: 'Created', width: 120, defaultPin: 'none' },
  { id: 'actions', label: 'Actions', width: 110, defaultPin: 'right' },
];

export default function DesignationPage() {
  const notify = useNotificationStore((s) => s.notify);
  const currentUser = useAuthStore((s) => s.user);
  const { data: roles = [] } = useRoles();
  const isAdmin = isUserAdmin(currentUser, roles);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput.trim());

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<Designation | null>(null);
  const [toDelete, setToDelete] = useState<Designation | null>(null);

  const { data, isLoading, isFetching, error } = useDesignations({ page, limit, search });
  const deleteDesignation = useDeleteDesignation();

  const { pins, setPin, getStickyStyles, isPinned } = useColumnPinning(
    'designations_page',
    DESIGNATION_COLUMNS
  );

  const handleCreate = () => {
    setSelectedDesignation(null);
    setModalOpen(true);
  };

  const handleEdit = (designation: Designation) => {
    setSelectedDesignation(designation);
    setModalOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteDesignation.mutate(toDelete.id, {
      onSuccess: () => {
        notify(`Deleted ${toDelete.title}`);
        setToDelete(null);
        if (data && data.items.length === 1 && page > 1) setPage(page - 1);
      },
      onError: (err) => {
        notify(getErrorMessage(err), 'error');
        setToDelete(null);
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Designations"
        description="Manage organizational job designations and their mapped access roles (Admin managed)."
        action={
          isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Add Designation
            </Button>
          )
        }
      />

      <Paper variant="outlined">
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <TextField
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, code or role..."
            size="small"
            sx={{ maxWidth: 360 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
              htmlInput: { 'aria-label': 'Search designations' },
            }}
          />
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
            <Table size="medium" stickyHeader sx={{ minWidth: 800 }}>
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
                    className={isPinned('code') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 110, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('code', true) }}
                  >
                    <ColumnHeaderPin columnId="code" title="Code" direction={pins['code']} onPinChange={setPin}>
                      CODE
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('title') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 220, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('title', true) }}
                  >
                    <ColumnHeaderPin columnId="title" title="Title" direction={pins['title']} onPinChange={setPin}>
                      TITLE
                    </ColumnHeaderPin>
                  </TableCell>

                  {/* Access Role Column */}
                  <TableCell
                    className={isPinned('role') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 190, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('role', true) }}
                  >
                    <ColumnHeaderPin columnId="role" title="Access Role" direction={pins['role']} onPinChange={setPin}>
                      ACCESS ROLE
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
                    className={isPinned('created') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 120, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('created', true) }}
                  >
                    <ColumnHeaderPin columnId="created" title="Created" direction={pins['created']} onPinChange={setPin}>
                      CREATED
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    align="right"
                    className={isPinned('actions') ? 'sticky-pinned-cell' : undefined}
                    sx={{
                      fontWeight: 700,
                      color: '#475569',
                      fontSize: '0.75rem',
                      letterSpacing: '0.04em',
                      width: 110,
                      minWidth: 110,
                      ...getStickyStyles('actions', true),
                    }}
                  >
                    <ColumnHeaderPin columnId="actions" title="Actions" direction={pins['actions']} onPinChange={setPin} align="right">
                      ACTIONS
                    </ColumnHeaderPin>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {search ? `No designations match “${search}”.` : 'No designations yet.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {data?.items.map((item, idx) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      '& td': { py: 1.5, verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9' },
                      '&:hover .sticky-pinned-cell': { bgcolor: '#f8fafc' },
                    }}
                  >
                    <TableCell
                      align="center"
                      className={isPinned('sno') ? 'sticky-pinned-cell' : undefined}
                      sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8125rem', ...getStickyStyles('sno', false) }}
                    >
                      {(page - 1) * limit + idx + 1}
                    </TableCell>
                    <TableCell
                      className={isPinned('code') ? 'sticky-pinned-cell' : undefined}
                      sx={{ fontWeight: 600, ...getStickyStyles('code', false) }}
                    >
                      {item.code}
                    </TableCell>
                    <TableCell
                      className={isPinned('title') ? 'sticky-pinned-cell' : undefined}
                      sx={{ fontWeight: 600, color: '#0f172a', ...getStickyStyles('title', false) }}
                    >
                      {item.title}
                    </TableCell>

                    {/* Access Role Badge */}
                    <TableCell
                      className={isPinned('role') ? 'sticky-pinned-cell' : undefined}
                      sx={{ ...getStickyStyles('role', false) }}
                    >
                      {item.roleName ? (
                        <Chip
                          size="small"
                          label={item.roleName}
                          color={
                            item.roleSlug === 'admin' || item.roleSlug === 'administrator'
                              ? 'primary'
                              : item.roleSlug === 'manager'
                              ? 'secondary'
                              : item.roleSlug === 'agent'
                              ? 'info'
                              : 'default'
                          }
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          variant="outlined"
                          label="Unassigned"
                          sx={{ color: '#94a3b8', borderColor: '#cbd5e1', fontSize: '0.72rem' }}
                        />
                      )}
                    </TableCell>

                    <TableCell
                      align="center"
                      className={isPinned('status') ? 'sticky-pinned-cell' : undefined}
                      sx={{ ...getStickyStyles('status', false) }}
                    >
                      <Chip
                        label={item.isActive ? 'Active' : 'Inactive'}
                        color={item.isActive ? 'success' : 'default'}
                        size="small"
                        variant={item.isActive ? 'filled' : 'outlined'}
                        sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell
                      className={isPinned('created') ? 'sticky-pinned-cell' : undefined}
                      sx={{ color: 'text.secondary', fontSize: '0.8125rem', ...getStickyStyles('created', false) }}
                    >
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className={isPinned('actions') ? 'sticky-pinned-cell' : undefined}
                      sx={{ ...getStickyStyles('actions', false) }}
                    >
                      <Tooltip title={isAdmin ? 'Edit Designation & Access Role' : 'View Designation'}>
                        <IconButton size="small" onClick={() => handleEdit(item)} color="primary">
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {isAdmin && (
                        <Tooltip title="Delete Designation">
                          <IconButton size="small" onClick={() => setToDelete(item)} color="error">
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component="div"
          count={data?.meta.total ?? 0}
          page={page - 1}
          onPageChange={(_, p) => setPage(p + 1)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
        />
      </Paper>

      <DesignationFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        designation={selectedDesignation}
        onSuccess={() => {}}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete Designation"
        message={`Are you sure you want to delete ${toDelete?.title}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
