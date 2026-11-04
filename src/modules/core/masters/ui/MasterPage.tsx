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
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog, ColumnHeaderPin, LoadingBlock, PageHeader, useColumnPinning, type ColumnPinConfig } from '@/shared/design-system';
import { useDebounce } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/utils/errors';
import { formatDate } from '@/shared/utils/format';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useDeleteMaster, useMasters } from '../hooks/useMasters';
import { MASTER_CONFIGS, type MasterType, type TicketMaster } from '../types';
import MasterFormModal from './MasterFormModal';

export default function MasterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawType = searchParams.get('type') as MasterType;
  const activeType: MasterType = MASTER_CONFIGS.some((c) => c.type === rawType) ? rawType : 'support_category';

  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';
  const notify = useNotificationStore((s) => s.notify);

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput.trim().toLowerCase());

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TicketMaster | null>(null);
  const [toDelete, setToDelete] = useState<TicketMaster | null>(null);

  const currentConfig = MASTER_CONFIGS.find((c) => c.type === activeType) || MASTER_CONFIGS[0];
  const hasParent = Boolean(currentConfig.parentType);

  const masterColumns: ColumnPinConfig[] = useMemo(() => {
    const cols: ColumnPinConfig[] = [
      { id: 'sno', label: 'S.No', width: 64, defaultPin: 'none' },
      { id: 'name', label: 'Name', width: 180, defaultPin: 'none' },
    ];
    if (hasParent) {
      cols.push({ id: 'parent', label: `Parent ${currentConfig.parentLabel?.toUpperCase() || ''}`, width: 160, defaultPin: 'none' });
    }
    cols.push(
      { id: 'code', label: 'Code', width: 120, defaultPin: 'none' },
      { id: 'description', label: 'Description', width: 200, defaultPin: 'none' },
      { id: 'created', label: 'Created', width: 120, defaultPin: 'none' },
      { id: 'actions', label: 'Actions', width: 110, defaultPin: 'right' },
    );
    return cols;
  }, [hasParent, currentConfig]);

  const { pins, setPin, getStickyStyles, isPinned } = useColumnPinning(
    `masters_page_${activeType}`,
    masterColumns
  );


  const { data: allSupportCats = [] } = useMasters('support_category');
  const { data: allIssueCats = [] } = useMasters('issue_category');
  const [selectedParentSupport, setSelectedParentSupport] = useState<string>('');
  const [selectedParentIssueCat, setSelectedParentIssueCat] = useState<string>('');

  const { data = [], isLoading, error, refetch } = useMasters(activeType);
  const deleteMaster = useDeleteMaster();

  const availableIssueCatsForFilter = useMemo(() => {
    if (!selectedParentSupport) return [];
    return allIssueCats.filter((ic) => ic.parentId === selectedParentSupport);
  }, [selectedParentSupport, allIssueCats]);

  const filtered = useMemo(() => {
    let result = data;
    if (activeType === 'issue_category' && selectedParentSupport) {
      result = result.filter((item) => item.parentId === selectedParentSupport);
    } else if (activeType === 'issue_type') {
      if (selectedParentIssueCat) {
        result = result.filter((item) => item.parentId === selectedParentIssueCat);
      } else if (selectedParentSupport) {
        const matchingCatIds = new Set(availableIssueCatsForFilter.map((ic) => ic.id));
        result = result.filter((item) => item.parentId && matchingCatIds.has(item.parentId));
      }
    }

    if (!search) return result;
    return result.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        (item.code && item.code.toLowerCase().includes(search)) ||
        (item.parentName && item.parentName.toLowerCase().includes(search)) ||
        (item.description && item.description.toLowerCase().includes(search)),
    );
  }, [data, search, activeType, selectedParentSupport, selectedParentIssueCat, availableIssueCatsForFilter]);

  useEffect(() => {
    setSearchInput('');
    setSelectedParentSupport('');
    setSelectedParentIssueCat('');
  }, [activeType]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: MasterType) => {
    setSearchParams({ type: newValue });
    setSearchInput('');
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: TicketMaster) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteMaster.mutate(toDelete.id, {
      onSuccess: () => {
        notify(`Deleted ${toDelete.name}`);
        setToDelete(null);
      },
      onError: (err) => {
        notify(getErrorMessage(err), 'error');
        setToDelete(null);
      },
    });
  };

  if (!isAdmin) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          Access Denied: Category Masters can only be configured by System Administrators.
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="Category Masters"
        description="Configure hierarchical support categories, issue categories, issue types, office locations, and ticket modes."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Add {currentConfig.label}
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={activeType}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          {MASTER_CONFIGS.map((cfg) => (
            <Tab key={cfg.type} value={cfg.type} label={cfg.label} />
          ))}
        </Tabs>

        <Box p={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <TextField
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Search ${currentConfig.label.toLowerCase()}...`}
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
              }}
            />

            {activeType === 'issue_category' && (
              <TextField
                select
                size="small"
                value={selectedParentSupport}
                onChange={(e) => setSelectedParentSupport(e.target.value)}
                sx={{ minWidth: 210, bgcolor: '#ffffff' }}
              >
                <MenuItem value="">All Support Categories</MenuItem>
                {allSupportCats.map((sc) => (
                  <MenuItem key={sc.id} value={sc.id}>
                    {sc.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {activeType === 'issue_type' && (
              <>
                <TextField
                  select
                  size="small"
                  value={selectedParentSupport}
                  onChange={(e) => {
                    setSelectedParentSupport(e.target.value);
                    setSelectedParentIssueCat('');
                  }}
                  sx={{ minWidth: 210, bgcolor: '#ffffff' }}
                >
                  <MenuItem value="">Select Support Category</MenuItem>
                  {allSupportCats.map((sc) => (
                    <MenuItem key={sc.id} value={sc.id}>
                      {sc.name}
                    </MenuItem>
                  ))}
                </TextField>

                {Boolean(selectedParentSupport) && (
                  <TextField
                    select
                    size="small"
                    value={selectedParentIssueCat}
                    onChange={(e) => setSelectedParentIssueCat(e.target.value)}
                    sx={{ minWidth: 210, bgcolor: '#ffffff' }}
                  >
                    <MenuItem value="">Select Issue Category</MenuItem>
                    {availableIssueCatsForFilter.map((ic) => (
                      <MenuItem key={ic.id} value={ic.id}>
                        {ic.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </>
            )}

            <Typography variant="body2" color="text.secondary">
              {currentConfig.description}
            </Typography>
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
                    className={isPinned('name') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 180, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('name', true) }}
                  >
                    <ColumnHeaderPin columnId="name" title="Name" direction={pins['name']} onPinChange={setPin}>
                      NAME
                    </ColumnHeaderPin>
                  </TableCell>
                  {hasParent && (
                    <TableCell
                      className={isPinned('parent') ? 'sticky-pinned-cell' : undefined}
                      sx={{ minWidth: 160, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('parent', true) }}
                    >
                      <ColumnHeaderPin columnId="parent" title={currentConfig.parentLabel || 'Parent'} direction={pins['parent']} onPinChange={setPin}>
                        PARENT {currentConfig.parentLabel?.toUpperCase()}
                      </ColumnHeaderPin>
                    </TableCell>
                  )}
                  <TableCell
                    className={isPinned('code') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 120, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('code', true) }}
                  >
                    <ColumnHeaderPin columnId="code" title="Code" direction={pins['code']} onPinChange={setPin}>
                      CODE
                    </ColumnHeaderPin>
                  </TableCell>
                  <TableCell
                    className={isPinned('description') ? 'sticky-pinned-cell' : undefined}
                    sx={{ minWidth: 200, fontWeight: 700, color: '#475569', fontSize: '0.75rem', letterSpacing: '0.04em', ...getStickyStyles('description', true) }}
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
                    <TableCell colSpan={hasParent ? 7 : 6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {search ? `No items match "${search}".` : `No items in ${currentConfig.label} yet.`}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((item, idx) => (
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
                      {idx + 1}
                    </TableCell>
                    <TableCell
                      className={isPinned('name') ? 'sticky-pinned-cell' : undefined}
                      sx={{ fontWeight: 600, color: '#0f172a', ...getStickyStyles('name', false) }}
                    >
                      {item.name}
                    </TableCell>
                    {hasParent && (
                      <TableCell
                        className={isPinned('parent') ? 'sticky-pinned-cell' : undefined}
                        sx={{ ...getStickyStyles('parent', false) }}
                      >
                        {item.parentName ? (
                          <Chip
                            size="small"
                            label={item.parentName}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            — Top Level —
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    <TableCell
                      className={isPinned('code') ? 'sticky-pinned-cell' : undefined}
                      sx={{ ...getStickyStyles('code', false) }}
                    >
                      {item.code ? <Chip size="small" label={item.code} variant="outlined" sx={{ fontWeight: 500 }} /> : '—'}
                    </TableCell>
                    <TableCell
                      className={isPinned('description') ? 'sticky-pinned-cell' : undefined}
                      sx={{ color: 'text.secondary', ...getStickyStyles('description', false) }}
                    >
                      {item.description || '—'}
                    </TableCell>
                    <TableCell
                      className={isPinned('created') ? 'sticky-pinned-cell' : undefined}
                      sx={{ whiteSpace: 'nowrap', color: 'text.secondary', ...getStickyStyles('created', false) }}
                    >
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className={isPinned('actions') ? 'sticky-pinned-cell' : undefined}
                      sx={{
                        whiteSpace: 'nowrap',
                        ...getStickyStyles('actions', false),
                      }}
                    >
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(item)} size="small">
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => setToDelete(item)} size="small" color="error">
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <MasterFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        masterType={activeType}
        typeLabel={currentConfig.label}
        item={selectedItem}
        onSuccess={() => void refetch()}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete Item"
        message={toDelete ? `Are you sure you want to delete "${toDelete.name}" from ${currentConfig.label}?` : ''}
        confirmLabel="Delete"
        loading={deleteMaster.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
