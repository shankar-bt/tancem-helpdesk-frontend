import AddIcon from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
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
import { ConfirmDialog, ColumnHeaderPin, LoadingBlock, PageHeader, useColumnPinning, type ColumnPinConfig } from '@/shared/design-system';
import { useDebounce } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/utils/errors';
import { formatDate } from '@/shared/utils/format';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePermissions } from '@/shared/hooks';
import { useDeleteDepartment, useDepartments } from '../hooks/useDepartments';
import type { Department } from '../types';
import DepartmentFormModal from './DepartmentFormModal';

const DEPT_COLUMNS: ColumnPinConfig[] = [
  { id: 'sno', label: 'S.No', width: 64, defaultPin: 'none' },
  { id: 'code', label: 'Code', width: 120, defaultPin: 'none' },
  { id: 'name', label: 'Department Name', width: 200, defaultPin: 'none' },
  { id: 'description', label: 'Description', width: 220, defaultPin: 'none' },
  { id: 'created', label: 'Created', width: 120, defaultPin: 'none' },
  { id: 'actions', label: 'Actions', width: 110, defaultPin: 'right' },
];

export default function DepartmentPage() {
  const notify = useNotificationStore((s) => s.notify);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput.trim().toLowerCase());

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [toDelete, setToDelete] = useState<Department | null>(null);

  const { data = [], isLoading, error, refetch } = useDepartments();
  const deleteDepartment = useDeleteDepartment();
  const { isAdmin, permissions: userPerms } = usePermissions();

  const { pins, setPin, getStickyStyles, isPinned } = useColumnPinning(
    'departments_page',
    DEPT_COLUMNS
  );

  const canCreate = isAdmin || userPerms.includes('departments:create') || userPerms.includes('departments:manage') || userPerms.includes('Departments');
  const canEdit = isAdmin || userPerms.includes('departments:edit') || userPerms.includes('departments:manage') || userPerms.includes('Departments');
  const canDelete = isAdmin || userPerms.includes('departments:delete') || userPerms.includes('departments:manage') || userPerms.includes('Departments');

  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter(
      (d) =>
        d.name.toLowerCase().includes(search) ||
        d.code.toLowerCase().includes(search) ||
        (d.description && d.description.toLowerCase().includes(search)),
    );
  }, [data, search]);

  const handleCreate = () => {
    setSelectedDepartment(null);
    setModalOpen(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setModalOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteDepartment.mutate(toDelete.id, {
      onSuccess: () => {
        notify(`Deleted department ${toDelete.name}`);
        setToDelete(null);
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
        title="Departments"
        description="Manage organizational departments and routing codes."
        action={
          canCreate ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Add Department
            </Button>
          ) : undefined
        }
      />

      <Paper variant="outlined">
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <TextField
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search departments by name or code"
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
              htmlInput: { 'aria-label': 'Search departments' },
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
          <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
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
                    sx={{ minWidth: 120, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('code', true) }}
                  >
                    <ColumnHeaderPin columnId="code" title="Code" direction={pins['code']} onPinChange={setPin}>
                      CODE
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('name') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 200, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('name', true) }}
                  >
                    <ColumnHeaderPin columnId="name" title="Department Name" direction={pins['name']} onPinChange={setPin}>
                      DEPARTMENT NAME
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('description') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 220, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('description', true) }}
                  >
                    <ColumnHeaderPin columnId="description" title="Description" direction={pins['description']} onPinChange={setPin}>
                      DESCRIPTION
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
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {search ? `No departments match “${search}”.` : 'No departments yet. Add one to get started.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((d, idx) => (
                  <TableRow
                    key={d.id}
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
                      {idx + 1}
                    </TableCell>
                    <TableCell
                      className={isPinned('code') ? 'sticky-pinned-cell' : undefined}
                      sx={{ fontWeight: 600, ...getStickyStyles('code', false) }}
                    >
                      {d.code}
                    </TableCell>
                    <TableCell
                      className={isPinned('name') ? 'sticky-pinned-cell' : undefined}
                      sx={{ fontWeight: 600, color: '#0f172a', ...getStickyStyles('name', false) }}
                    >
                      {d.name}
                    </TableCell>
                    <TableCell
                      className={isPinned('description') ? 'sticky-pinned-cell' : undefined}
                      sx={{ color: 'text.secondary', ...getStickyStyles('description', false) }}
                    >
                      {d.description || '—'}
                    </TableCell>
                    <TableCell
                      className={isPinned('created') ? 'sticky-pinned-cell' : undefined}
                      sx={{ whiteSpace: 'nowrap', color: 'text.secondary', ...getStickyStyles('created', false) }}
                    >
                      {formatDate(d.createdAt)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className={isPinned('actions') ? 'sticky-pinned-cell' : undefined}
                      sx={{
                        whiteSpace: 'nowrap',
                        ...getStickyStyles('actions', false),
                      }}
                    >
                      {canEdit && (
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(d)} aria-label={`Edit ${d.name}`} size="small">
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton onClick={() => setToDelete(d)} aria-label={`Delete ${d.name}`} size="small" color="error">
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!canEdit && !canDelete && (
                        <Typography variant="caption" color="text.secondary">
                          View only
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <DepartmentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        department={selectedDepartment}
        onSuccess={() => void refetch()}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete Department"
        message={toDelete ? `Are you sure you want to delete department ${toDelete.name}?` : ''}
        confirmLabel="Delete"
        loading={deleteDepartment.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
