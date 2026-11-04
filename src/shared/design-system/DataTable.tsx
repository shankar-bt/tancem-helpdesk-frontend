import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useMemo, type ReactNode } from 'react';
import { PAGE_SIZE_OPTIONS } from '@/shared/utils/constants';
import { getErrorMessage } from '@/shared/utils/errors';
import ColumnHeaderPin from './ColumnHeaderPin';
import LoadingBlock from './LoadingBlock';
import { useColumnPinning, type ColumnPinConfig } from './useColumnPinning';

export interface Column<T> {
  id: string;
  header: ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  render?: (item: T, index: number) => ReactNode;
}

export interface DataTablePagination {
  page: number; // 1-indexed
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  rowsPerPageOptions?: readonly number[];
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  loading?: boolean;
  isFetching?: boolean;
  emptyMessage?: string;
  toolbar?: ReactNode;
  error?: unknown;
  pagination?: DataTablePagination;
  size?: 'small' | 'medium';
  showSerialNo?: boolean;
  stickyHeader?: boolean;
  tableKey?: string;
  enablePinning?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  isFetching = false,
  emptyMessage = 'No records found.',
  toolbar,
  error,
  pagination,
  size = 'medium',
  showSerialNo = true,
  stickyHeader = true,
  tableKey = 'datatable',
  enablePinning = true,
}: DataTableProps<T>) {
  const serialNoColSpan = showSerialNo ? 1 : 0;

  const pinConfigs: ColumnPinConfig[] = useMemo(() => {
    const list: ColumnPinConfig[] = [];
    if (showSerialNo) {
      list.push({ id: 'sno', label: 'S.No', width: 64, defaultPin: 'none' });
    }
    columns.forEach((col) => {
      const isAction = col.id === 'action' || col.id === 'actions';
      list.push({
        id: col.id,
        label: typeof col.header === 'string' ? col.header : col.id.toUpperCase(),
        width: typeof col.width === 'number' ? col.width : 140,
        defaultPin: isAction ? 'right' : 'none',
      });
    });
    return list;
  }, [columns, showSerialNo]);

  const { pins, setPin, getStickyStyles, isPinned } = useColumnPinning(
    tableKey,
    pinConfigs
  );

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2 }}>
      {toolbar && (
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
          <Box flex={1}>{toolbar}</Box>
        </Box>
      )}

      {Boolean(error) && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          {getErrorMessage(error)}
        </Alert>
      )}

      {loading ? (
        <LoadingBlock />
      ) : (
        <TableContainer sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 120ms', maxHeight: 'calc(100vh - 280px)' }}>
          <Table size={size} stickyHeader={stickyHeader}>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', py: 1.5, borderBottom: '1px solid #e2e8f0' } }}>
                {showSerialNo && (
                  <TableCell
                    align="center"
                    className={isPinned('sno') ? 'sticky-pinned-cell' : undefined}
                    sx={{
                      width: 64,
                      minWidth: 64,
                      fontWeight: 700,
                      color: '#475569',
                      fontSize: '0.75rem',
                      letterSpacing: '0.04em',
                      ...getStickyStyles('sno', true),
                    }}
                  >
                    {enablePinning ? (
                      <ColumnHeaderPin
                        columnId="sno"
                        title="S.No"
                        direction={pins['sno']}
                        onPinChange={setPin}
                        align="center"
                      >
                        S.NO
                      </ColumnHeaderPin>
                    ) : (
                      'S.NO'
                    )}
                  </TableCell>
                )}
                {columns.map((col) => {
                  const isAction = col.id === 'action' || col.id === 'actions';
                  const align = col.align || (isAction ? 'right' : 'left');
                  const headerTitle = typeof col.header === 'string' ? col.header : col.id;
                  return (
                    <TableCell
                      key={col.id}
                      align={align}
                      className={isPinned(col.id) ? 'sticky-pinned-cell' : undefined}
                      sx={{
                        width: col.width,
                        fontWeight: 700,
                        color: '#475569',
                        fontSize: '0.75rem',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                        ...getStickyStyles(col.id, true),
                      }}
                    >
                      {enablePinning ? (
                        <ColumnHeaderPin
                          columnId={col.id}
                          title={headerTitle}
                          direction={pins[col.id]}
                          onPinChange={setPin}
                          align={align}
                        >
                          {col.header}
                        </ColumnHeaderPin>
                      ) : (
                        col.header
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + serialNoColSpan} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">{emptyMessage}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow
                    key={keyExtractor(item, index)}
                    hover
                    sx={{
                      '& td': { py: 1.5, verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9' },
                      '&:hover .sticky-pinned-cell': { bgcolor: '#f8fafc' },
                    }}
                  >
                    {showSerialNo && (
                      <TableCell
                        align="center"
                        className={isPinned('sno') ? 'sticky-pinned-cell' : undefined}
                        sx={{
                          fontWeight: 600,
                          color: 'text.secondary',
                          fontSize: '0.8125rem',
                          ...getStickyStyles('sno', false),
                        }}
                      >
                        {pagination?.page ? (pagination.page - 1) * pagination.limit + index + 1 : index + 1}
                      </TableCell>
                    )}
                    {columns.map((col) => {
                      const isAction = col.id === 'action' || col.id === 'actions';
                      return (
                        <TableCell
                          key={col.id}
                          align={col.align || (isAction ? 'right' : 'left')}
                          className={isPinned(col.id) ? 'sticky-pinned-cell' : undefined}
                          sx={{
                            width: col.width,
                            ...getStickyStyles(col.id, false),
                          }}
                        >
                          {col.render
                            ? col.render(item, index)
                            : (item as Record<string, unknown>)[col.id] != null
                              ? String((item as Record<string, unknown>)[col.id])
                              : '—'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={Math.max(0, pagination.page - 1)}
          rowsPerPage={pagination.limit}
          rowsPerPageOptions={[...(pagination.rowsPerPageOptions || PAGE_SIZE_OPTIONS)]}
          onPageChange={(_, newPage) => pagination.onPageChange(newPage + 1)}
          onRowsPerPageChange={(e) => {
            if (pagination.onLimitChange) {
              pagination.onLimitChange(Number(e.target.value));
            }
          }}
        />
      )}
    </Paper>
  );
}
