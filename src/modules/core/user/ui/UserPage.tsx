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
import { useDepartments } from '@/modules/core/departments/hooks/useDepartments';
import { useRoles } from '@/modules/core/roles/hooks/useRoles';
import { ConfirmDialog, ColumnHeaderPin, LoadingBlock, PageHeader, useColumnPinning, type ColumnPinConfig } from '@/shared/design-system';
import { useDebounce } from '@/shared/hooks';
import { PAGE_SIZE_OPTIONS } from '@/shared/utils/constants';
import { getErrorMessage } from '@/shared/utils/errors';
import { formatDate } from '@/shared/utils/format';
import { isUserAdmin, isUserManager, isUserAgent } from '@/shared/utils';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useDeleteUser, useUsers } from '../hooks/useUser';
import type { User } from '../types';
import UserFormModal from './UserFormModal';

const USER_COLUMNS: ColumnPinConfig[] = [
  { id: 'sno', label: 'S.No', width: 64, defaultPin: 'none' },
  { id: 'name', label: 'Name', width: 180, defaultPin: 'none' },
  { id: 'email', label: 'Email', width: 200, defaultPin: 'none' },
  { id: 'role', label: 'Role', width: 130, defaultPin: 'none' },
  { id: 'office', label: 'Office Category', width: 170, defaultPin: 'none' },
  { id: 'dept', label: 'Department', width: 160, defaultPin: 'none' },
  { id: 'created', label: 'Added', width: 110, defaultPin: 'none' },
  { id: 'actions', label: 'Actions', width: 110, defaultPin: 'right' },
];

export default function UserPage() {
  const currentUser = useAuthStore((s) => s.user);
  const notify = useNotificationStore((s) => s.notify);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput.trim());

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useUsers({ page, limit, search });
  const { data: departments = [] } = useDepartments();
  const { data: roles = [] } = useRoles();
  const isAdmin = isUserAdmin(currentUser, roles);
  const deleteUser = useDeleteUser();

  const deptMap = new Map(departments.map((d) => [d.id, d]));
  const roleMap = new Map(roles.map((r) => [r.id, r]));

  const { pins, setPin, getStickyStyles, isPinned } = useColumnPinning(
    'users_page',
    USER_COLUMNS
  );


  const handleCreate = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteUser.mutate(toDelete.id, {
      onSuccess: () => {
        notify(`Deleted ${toDelete.name}`);
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
        title="Users"
        description="Manage workspace users and permission roles."
        action={
          isAdmin ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Add User
            </Button>
          ) : undefined
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
            placeholder="Search by name or email"
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
              htmlInput: { 'aria-label': 'Search users' },
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
            <Table size="medium" stickyHeader sx={{ minWidth: 1000 }}>
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
                    className={isPinned('name') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 180, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('name', true) }}
                  >
                    <ColumnHeaderPin columnId="name" title="Name" direction={pins['name']} onPinChange={setPin}>
                      NAME
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('email') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 200, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('email', true) }}
                  >
                    <ColumnHeaderPin columnId="email" title="Email" direction={pins['email']} onPinChange={setPin}>
                      EMAIL
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('role') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 130, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('role', true) }}
                  >
                    <ColumnHeaderPin columnId="role" title="Role" direction={pins['role']} onPinChange={setPin}>
                      ROLE
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('office') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 170, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('office', true) }}
                  >
                    <ColumnHeaderPin columnId="office" title="Office Category" direction={pins['office']} onPinChange={setPin}>
                      OFFICE CATEGORY
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('dept') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 160, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('dept', true) }}
                  >
                    <ColumnHeaderPin columnId="dept" title="Department" direction={pins['dept']} onPinChange={setPin}>
                      DEPARTMENT
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('created') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 110, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('created', true) }}
                  >
                    <ColumnHeaderPin columnId="created" title="Added" direction={pins['created']} onPinChange={setPin}>
                      ADDED
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
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {search ? `No users match “${search}”.` : 'No users yet. Add the first one to get started.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {data?.items.map((u, idx) => {
                  const canEdit = isAdmin || u.id === currentUser?.id;
                  const canDelete = isAdmin && u.id !== currentUser?.id;
                  const dept = u.departmentId ? deptMap.get(u.departmentId) : null;
                  const roleObj = u.roleId ? roleMap.get(u.roleId) : null;
                  const isUserDeptManager = isUserManager(u, roleMap);
                  const isRowAdmin = isUserAdmin(u, roleMap);
                  const isRowAgent = isUserAgent(u, roleMap);

                  return (
                    <TableRow
                      key={u.id}
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
                        className={isPinned('name') ? 'sticky-pinned-cell' : undefined}
                        sx={{ fontWeight: 600, color: '#0f172a', ...getStickyStyles('name', false) }}
                      >
                        {u.name}
                      </TableCell>
                      <TableCell
                        className={isPinned('email') ? 'sticky-pinned-cell' : undefined}
                        sx={{ color: 'text.secondary', ...getStickyStyles('email', false) }}
                      >
                        {u.email}
                      </TableCell>
                      <TableCell
                        className={isPinned('role') ? 'sticky-pinned-cell' : undefined}
                        sx={{ ...getStickyStyles('role', false) }}
                      >
                        <Chip
                          size="small"
                          label={
                            isRowAdmin
                              ? 'Admin'
                              : isUserDeptManager
                                ? 'Dept Manager'
                                : isRowAgent
                                  ? 'Agent'
                                  : (roleObj?.name || 'User')
                          }
                          color={
                            isRowAdmin
                              ? 'primary'
                              : isUserDeptManager
                                ? 'warning'
                                : isRowAgent
                                  ? 'secondary'
                                  : 'default'
                          }
                          variant={isRowAdmin || isUserDeptManager ? 'filled' : 'outlined'}
                        />
                      </TableCell>

                      <TableCell
                        className={isPinned('office') ? 'sticky-pinned-cell' : undefined}
                        sx={{ ...getStickyStyles('office', false) }}
                      >
                        {u.officeCategory ? (
                          <Chip
                            size="small"
                            label={u.officeCategory}
                            sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 500 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell
                        className={isPinned('dept') ? 'sticky-pinned-cell' : undefined}
                        sx={{ ...getStickyStyles('dept', false) }}
                      >
                        {dept ? (
                          <Typography variant="body2">
                            {dept.name} <span style={{ color: '#94a3b8' }}>({dept.code})</span>
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell
                        className={isPinned('created') ? 'sticky-pinned-cell' : undefined}
                        sx={{ whiteSpace: 'nowrap', color: 'text.secondary', ...getStickyStyles('created', false) }}
                      >
                        {formatDate(u.createdAt)}
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
                            <IconButton onClick={() => handleEdit(u)} aria-label={`Edit ${u.name}`} size="small">
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title="Delete">
                            <IconButton onClick={() => setToDelete(u)} aria-label={`Delete ${u.name}`} size="small" color="error">
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
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

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={selectedUser}
        onSuccess={() => void refetch()}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete user"
        message={toDelete ? `Delete ${toDelete.name} (${toDelete.email})? They will no longer be able to sign in. This cannot be undone.` : ''}
        confirmLabel="Delete user"
        loading={deleteUser.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
