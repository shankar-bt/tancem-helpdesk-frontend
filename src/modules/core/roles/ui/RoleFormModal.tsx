import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
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
import { useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '@/shared/utils/errors';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCreateRole, usePermissions, useUpdateRole } from '../hooks/useRoles';
import type { Permission, Role } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  role?: Role | null;
  onSuccess?: () => void;
}

const ACTION_KEYS = ['view', 'create', 'edit', 'delete'] as const;
type ActionKey = typeof ACTION_KEYS[number];

const MODULE_DESCRIPTIONS: Record<string, string> = {
  Dashboard: 'Executive analytics, ticket statistics & operational overview',
  Tickets: 'Ticket Desk, ticket creation, triage & resolution',
  'Reports & Analytics': 'Operational reporting, compliance KPIs & data exports',
  'User Management': 'Corporate users, staff profiles & assignment',
  'Category Masters': 'Support categories, issue categories & types',
  Departments: 'Corporate departments & organizational structure',
  Designations: 'Corporate staff designations, codes & ranks',
  'SLA Policies': 'Service level agreements, escalation & resolution targets',
  'Roles & Permissions': 'Access control & role permission matrix',
};

export default function RoleFormModal({ open, onClose, role, onSuccess }: Props) {
  const isEdit = Boolean(role);
  const notify = useNotificationStore((s) => s.notify);

  const { data: permissionGroups = [] } = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole(role?.id ?? '');

  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

  // Flat list of all available permissions
  const allPermissions = useMemo(() => {
    return permissionGroups.flatMap((g) => g.permissions);
  }, [permissionGroups]);

  useEffect(() => {
    if (open) {
      setRoleName(role?.name ?? '');
      setDescription(role?.description ?? '');
      const existingIds = role?.permissions?.map((p) => p.id) ?? [];
      setSelectedPermIds(existingIds);
    }
  }, [open, role]);

  // Toggle single permission by ID
  const togglePermission = (id: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  };

  // Helper to get permission for a module and action
  const getPermission = (groupPermissions: Permission[], action: ActionKey): Permission | undefined => {
    return groupPermissions.find((p) => {
      const slugAction = p.slug?.split(':')[1]?.toLowerCase();
      if (slugAction) return slugAction === action;
      return p.name.toLowerCase().includes(action);
    });
  };

  // Check if all permissions for a specific module are selected
  const isModuleAllSelected = (groupPermissions: Permission[]) => {
    if (groupPermissions.length === 0) return false;
    return groupPermissions.every((p) => selectedPermIds.includes(p.id));
  };

  // Check if some (not all) permissions for a module are selected
  const isModuleIndeterminate = (groupPermissions: Permission[]) => {
    const count = groupPermissions.filter((p) => selectedPermIds.includes(p.id)).length;
    return count > 0 && count < groupPermissions.length;
  };

  // Toggle all permissions for a specific module
  const toggleModuleAll = (groupPermissions: Permission[]) => {
    const allSelected = isModuleAllSelected(groupPermissions);
    const moduleIds = groupPermissions.map((p) => p.id);
    if (allSelected) {
      setSelectedPermIds((prev) => prev.filter((id) => !moduleIds.includes(id)));
    } else {
      setSelectedPermIds((prev) => Array.from(new Set([...prev, ...moduleIds])));
    }
  };

  // Quick action: Select All
  const handleSelectAll = () => {
    setSelectedPermIds(allPermissions.map((p) => p.id));
  };

  // Quick action: Clear All
  const handleClearAll = () => {
    setSelectedPermIds([]);
  };

  // Quick action: View Only
  const handleViewOnly = () => {
    const viewIds = allPermissions
      .filter((p) => p.slug?.endsWith(':view') || p.name.toLowerCase().includes('view'))
      .map((p) => p.id);
    setSelectedPermIds(viewIds);
  };

  const isSubmitting = createRole.isPending || updateRole.isPending;
  const currentError = isEdit ? updateRole.error : createRole.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    const slug =
      role?.slug ||
      roleName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    if (isEdit && role) {
      updateRole.mutate(
        {
          name: roleName.trim(),
          description: description.trim() || undefined,
          permissionIds: selectedPermIds,
        },
        {
          onSuccess: () => {
            notify(`Role "${roleName}" updated successfully`);
            onClose();
            onSuccess?.();
          },
        },
      );
    } else {
      createRole.mutate(
        {
          name: roleName.trim(),
          slug,
          description: description.trim() || undefined,
          permissionIds: selectedPermIds,
        },
        {
          onSuccess: (created) => {
            notify(`Created role "${created.name}" with ${selectedPermIds.length} permissions`);
            onClose();
            onSuccess?.();
          },
        },
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: '1.25rem',
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          py: 2,
          flexShrink: 0,
        }}
      >
        {isEdit ? `Edit Role: ${role?.name}` : 'Create New Role'}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: { xs: 2, sm: 3 },
          flexGrow: 1,
          overflowY: 'auto',
        }}
      >
        <form id="role-modal-form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            {currentError && <Alert severity="error">{getErrorMessage(currentError)}</Alert>}

            {/* Role Info Inputs */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2.5}>
              <Box>
                <Typography variant="body2" fontWeight={600} mb={0.75} color="#0f172a">
                  Role Name *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Helpdesk Lead, Auditor, Support Technician"
                  required
                  autoFocus
                />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600} mb={0.75} color="#0f172a">
                  Description (Optional)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of role responsibilities"
                />
              </Box>
            </Box>

            {/* Matrix Section Header & Quick Actions */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} mb={1.5}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                    Page & Module Access Control
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Configure granular privileges (View, Create, Edit, Delete) for each page in the application.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={`${selectedPermIds.length} of ${allPermissions.length} Privileges`}
                    color={selectedPermIds.length > 0 ? 'primary' : 'default'}
                    sx={{ fontWeight: 600, mr: 0.5 }}
                  />
                  <Button size="small" variant="outlined" onClick={handleSelectAll} sx={{ textTransform: 'none', py: 0.25, px: 1.5 }}>
                    Select All
                  </Button>
                  <Button size="small" variant="outlined" onClick={handleViewOnly} sx={{ textTransform: 'none', py: 0.25, px: 1.5 }}>
                    View Only
                  </Button>
                  <Button size="small" color="inherit" onClick={handleClearAll} sx={{ textTransform: 'none', py: 0.25, px: 1.5 }}>
                    Clear
                  </Button>
                </Stack>
              </Box>

              {/* Granular Permission Matrix Table */}
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: '#e2e8f0',
                  maxHeight: 450,
                  overflowY: 'auto',
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: '#f1f5f9', fontWeight: 700, color: '#334155', fontSize: '0.8rem' } }}>
                      <TableCell sx={{ width: '36%' }}>PAGE / MODULE</TableCell>
                      <TableCell align="center" sx={{ width: '13%' }}>VIEW</TableCell>
                      <TableCell align="center" sx={{ width: '13%' }}>CREATE</TableCell>
                      <TableCell align="center" sx={{ width: '13%' }}>EDIT</TableCell>
                      <TableCell align="center" sx={{ width: '13%' }}>DELETE</TableCell>
                      <TableCell align="center" sx={{ width: '12%' }}>ALL</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {permissionGroups.map((group) => {
                      const viewPerm = getPermission(group.permissions, 'view');
                      const createPerm = getPermission(group.permissions, 'create');
                      const editPerm = getPermission(group.permissions, 'edit');
                      const deletePerm = getPermission(group.permissions, 'delete');

                      const isAll = isModuleAllSelected(group.permissions);
                      const isIndeterminate = isModuleIndeterminate(group.permissions);

                      return (
                        <TableRow key={group.module} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          {/* Module / Page Name */}
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography variant="body2" fontWeight={600} color="#0f172a">
                              {group.module}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.74rem' }}>
                              {group.permissions.find((p) => p.description && !p.description.toLowerCase().startsWith('view'))?.description ||
                                group.permissions[0]?.description ||
                                MODULE_DESCRIPTIONS[group.module] ||
                                'Granular access controls and permissions for ' + group.module}
                            </Typography>
                          </TableCell>

                          {/* View Action */}
                          <TableCell align="center">
                            {viewPerm ? (
                              <Tooltip title={viewPerm.description || `View ${group.module}`}>
                                <Checkbox
                                  size="small"
                                  checked={selectedPermIds.includes(viewPerm.id)}
                                  onChange={() => togglePermission(viewPerm.id)}
                                  sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#2563eb' } }}
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>

                          {/* Create Action */}
                          <TableCell align="center">
                            {createPerm ? (
                              <Tooltip title={createPerm.description || `Create in ${group.module}`}>
                                <Checkbox
                                  size="small"
                                  checked={selectedPermIds.includes(createPerm.id)}
                                  onChange={() => togglePermission(createPerm.id)}
                                  sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#16a34a' } }}
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>

                          {/* Edit Action */}
                          <TableCell align="center">
                            {editPerm ? (
                              <Tooltip title={editPerm.description || `Edit in ${group.module}`}>
                                <Checkbox
                                  size="small"
                                  checked={selectedPermIds.includes(editPerm.id)}
                                  onChange={() => togglePermission(editPerm.id)}
                                  sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#d97706' } }}
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>

                          {/* Delete Action */}
                          <TableCell align="center">
                            {deletePerm ? (
                              <Tooltip title={deletePerm.description || `Delete in ${group.module}`}>
                                <Checkbox
                                  size="small"
                                  checked={selectedPermIds.includes(deletePerm.id)}
                                  onChange={() => togglePermission(deletePerm.id)}
                                  sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#dc2626' } }}
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>

                          {/* Select All Row */}
                          <TableCell align="center">
                            <Tooltip title={`Toggle all ${group.module} privileges`}>
                              <Checkbox
                                size="small"
                                checked={isAll}
                                indeterminate={isIndeterminate}
                                onChange={() => toggleModuleAll(group.permissions)}
                                sx={{ color: '#64748b' }}
                              />
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        </form>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {selectedPermIds.length} of {allPermissions.length} privileges configured
        </Typography>

        <Stack direction="row" spacing={1.5}>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            variant="outlined"
            size="medium"
            sx={{
              borderColor: '#cbd5e1',
              color: '#334155',
              borderRadius: 1.5,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="role-modal-form"
            variant="contained"
            size="medium"
            disabled={isSubmitting || !roleName.trim()}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              borderRadius: 1.5,
              px: 3.5,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
            }}
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Role'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
