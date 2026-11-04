import AddIcon from '@mui/icons-material/Add';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { ConfirmDialog, ColumnHeaderPin, LoadingBlock, useColumnPinning, type ColumnPinConfig } from '@/shared/design-system';
import { isUserAdmin } from '@/shared/utils/roles';
import { getErrorMessage } from '@/shared/utils/errors';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useDeleteRole, useRoles } from '../hooks/useRoles';
import type { Role } from '../types';
import RoleFormModal from './RoleFormModal';

const ROLE_COLUMNS: ColumnPinConfig[] = [
  { id: 'sno', label: 'S.No', width: 64, defaultPin: 'none' },
  { id: 'name', label: 'Role Name', width: 220, defaultPin: 'none' },
  { id: 'privileges', label: 'Access Privileges', width: 450, defaultPin: 'none' },
  { id: 'actions', label: 'Actions', width: 110, defaultPin: 'right' },
];

export default function RolePage() {
  const currentUser = useAuthStore((s) => s.user);
  const notify = useNotificationStore((s) => s.notify);

  const { data = [], isLoading, error, refetch } = useRoles();
  const isAdmin = isUserAdmin(currentUser, data);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [toDelete, setToDelete] = useState<Role | null>(null);

  const deleteRole = useDeleteRole();

  const { pins, setPin, getStickyStyles, isPinned } = useColumnPinning(
    'roles_page',
    ROLE_COLUMNS
  );


  const handleCreate = () => {
    setSelectedRole(null);
    setModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setModalOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteRole.mutate(toDelete.id, {
      onSuccess: () => {
        notify(`Deleted role ${toDelete.name}`);
        setToDelete(null);
      },
      onError: (err) => {
        notify(getErrorMessage(err), 'error');
        setToDelete(null);
      },
    });
  };

  // Restrict access strictly to Admin and Super Admin
  if (!isAdmin) {
    return (
      <Box p={{ xs: 2, md: 4 }} maxWidth={800} mx="auto">
        <Alert severity="error" sx={{ borderRadius: 2, p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body2">
            Access to Roles & Permissions is restricted exclusively to System Administrators and Super Admins.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 1.5, fontSize: '0.875rem' }}>
        <Typography color="text.secondary">Administration</Typography>
        <Typography color="text.primary" fontWeight={600}>Roles & Permissions</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityOutlined sx={{ color: '#2563eb' }} />
            <Typography variant="h5" fontWeight={700} color="#0f172a" letterSpacing="-0.01em">
              Roles & Permissions
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Configure granular view, create, edit, and delete privileges per module. Accessible only by Administrators.
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 2.5,
              py: 1,
              boxShadow: 'none',
            }}
          >
            Create Role
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getErrorMessage(error)}
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          borderColor: '#e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {isLoading ? (
          <LoadingBlock />
        ) : (
          <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
            <Table size="medium" stickyHeader sx={{ minWidth: 850 }}>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow sx={{ '& th': { bgcolor: '#f8fafc', py: 1.5, borderBottom: '1px solid #e2e8f0' } }}>
                  <TableCell
                    align="center"
                    className={isPinned('sno') ? 'sticky-pinned-cell' : undefined}
                    sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', width: 64, minWidth: 64, ...getStickyStyles('sno', true) }}
                  >
                    <ColumnHeaderPin columnId="sno" title="S.No" direction={pins['sno']} onPinChange={setPin} align="center">
                      S.NO
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('name') ? 'sticky-pinned-cell' : undefined}
                    sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', minWidth: 200, width: '22%', ...getStickyStyles('name', true) }}
                  >
                    <ColumnHeaderPin columnId="name" title="Role Name" direction={pins['name']} onPinChange={setPin}>
                      ROLE NAME
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('privileges') ? 'sticky-pinned-cell' : undefined}
                    sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', minWidth: 350, ...getStickyStyles('privileges', true) }}
                  >
                    <ColumnHeaderPin columnId="privileges" title="Privileges" direction={pins['privileges']} onPinChange={setPin}>
                      ACCESS PRIVILEGES (PAGE & ACTIONS)
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
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No roles found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {data.map((r, idx) => {
                  const perms = r.permissions ?? [];
                  const isSuperOrFull = perms.length >= 21;

                  // Group permissions by module
                  const moduleMap = new Map<string, string[]>();
                  for (const p of perms) {
                    const mod = p.module || 'General';
                    const action = p.slug?.split(':')[1] || p.name;
                    const list = moduleMap.get(mod) ?? [];
                    list.push(action);
                    moduleMap.set(mod, list);
                  }

                  return (
                    <TableRow
                      key={r.id}
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
                        className={isPinned('name') ? 'sticky-pinned-cell' : undefined}
                        sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem', ...getStickyStyles('name', false) }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={600} color="#0f172a">
                            {r.name}
                          </Typography>
                          {r.description && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {r.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell
                        className={isPinned('privileges') ? 'sticky-pinned-cell' : undefined}
                        sx={{ ...getStickyStyles('privileges', false) }}
                      >
                        {isSuperOrFull ? (
                          <Chip
                            size="small"
                            label="Full Access (All Privileges: View, Create, Edit, Delete)"
                            sx={{
                              bgcolor: '#ecfdf5',
                              color: '#065f46',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              border: '1px solid #a7f3d0',
                              px: 0.5,
                            }}
                          />
                        ) : perms.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            No privileges assigned
                          </Typography>
                        ) : (
                          <Box display="flex" flexWrap="wrap" gap={0.75}>
                            {Array.from(moduleMap.entries()).map(([mod, actions]) => (
                              <Chip
                                key={mod}
                                size="small"
                                label={`${mod}: ${actions.join(', ')}`}
                                sx={{
                                  bgcolor: '#f1f5f9',
                                  color: '#334155',
                                  fontWeight: 500,
                                  fontSize: '0.78rem',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={isPinned('actions') ? 'sticky-pinned-cell' : undefined}
                        sx={{
                          whiteSpace: 'nowrap',
                          ...getStickyStyles('actions', false),
                        }}
                      >
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit Role & Permissions">
                            <IconButton
                              onClick={() => handleEdit(r)}
                              size="small"
                              sx={{
                                border: '1px solid #e2e8f0',
                                borderRadius: 1.5,
                                color: '#64748b',
                                '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                              }}
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Role">
                            <IconButton
                              onClick={() => setToDelete(r)}
                              size="small"
                              disabled={r.slug === 'admin' || r.slug === 'administrator'}
                              sx={{
                                border: '1px solid #fecaca',
                                borderRadius: 1.5,
                                color: '#ef4444',
                                '&:hover': { bgcolor: '#fee2e2' },
                                '&.Mui-disabled': { opacity: 0.4, borderColor: '#e2e8f0' },
                              }}
                            >
                              <DeleteOutline fontSize="small" />
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

        {/* Footer pagination */}
        <Box
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          px={3}
          py={2}
          borderTop="1px solid #f1f5f9"
          gap={2}
        >
          <Typography variant="body2" color="text.secondary">
            Showing 1 to {data.length} of {data.length} entries
          </Typography>
          <IconButton size="small" disabled sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            Page 1 of 1
          </Typography>
          <IconButton size="small" disabled sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
            <ChevronRight fontSize="small" />
          </IconButton>
        </Box>
      </Paper>

      <RoleFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        role={selectedRole}
        onSuccess={() => void refetch()}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete Role"
        message={toDelete ? `Are you sure you want to delete role "${toDelete.name}"?` : ''}
        confirmLabel="Delete"
        loading={deleteRole.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
}
