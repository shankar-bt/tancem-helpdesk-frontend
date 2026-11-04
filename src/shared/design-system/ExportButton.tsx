import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import Box from '@mui/material/Box';
import Button, { type ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';
import {
  exportToCsv,
  exportToExcel,
  exportToPdf,
  type ExportColumn,
} from '@/shared/utils/exportUtils';

export interface ExportButtonProps<T = any> {
  data: T[] | (() => Promise<T[]> | T[]);
  columns: ExportColumn<T>[];
  filename?: string;
  title?: string;
  subtitle?: string;
  label?: string;
  size?: 'small' | 'medium';
  variant?: ButtonProps['variant'];
  color?: ButtonProps['color'];
  disabled?: boolean;
}

export default function ExportButton<T = any>({
  data,
  columns,
  filename = 'export',
  title = 'Data Export',
  subtitle,
  label = 'Export',
  size = 'small',
  variant = 'outlined',
  color = 'inherit',
  disabled = false,
}: ExportButtonProps<T>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf' | 'csv' | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const resolveData = async (): Promise<T[]> => {
    if (typeof data === 'function') {
      return await data();
    }
    return data;
  };

  const handleExport = async (type: 'excel' | 'pdf' | 'csv') => {
    handleClose();
    try {
      setIsExporting(true);
      setExportType(type);
      const rows = await resolveData();

      const options = {
        filename: `${filename}_${new Date().toISOString().slice(0, 10)}`,
        title,
        subtitle,
        columns,
        data: rows,
      };

      if (type === 'excel') {
        await exportToExcel(options);
      } else if (type === 'pdf') {
        exportToPdf(options);
      } else if (type === 'csv') {
        exportToCsv(options);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <>
      <Tooltip title="Download records in Excel, PDF, or CSV format">
        <span>
          <Button
            size={size}
            variant={variant}
            color={color}
            disabled={disabled || isExporting}
            onClick={handleClick}
            startIcon={
              isExporting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
              )
            }
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8125rem',
              borderColor: '#cbd5e1',
              color: '#334155',
              bgcolor: '#ffffff',
              height: 38,
              borderRadius: 1.5,
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: '#f8fafc',
                borderColor: '#94a3b8',
              },
            }}
          >
            {isExporting
              ? `Exporting ${exportType?.toUpperCase() || ''}...`
              : label}
          </Button>
        </span>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              minWidth: 220,
              borderRadius: 2,
              mt: 0.75,
              border: '1px solid #e2e8f0',
              p: 0.5,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
            },
          },
        }}
      >
        <Box px={1.5} py={0.75}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.6875rem',
            }}
          >
            Export Format
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />

        {/* Excel */}
        <MenuItem
          onClick={() => handleExport('excel')}
          sx={{
            borderRadius: 1.5,
            py: 1,
            px: 1.5,
            gap: 1.25,
            '&:hover': { bgcolor: '#f0fdf4' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 'auto !important' }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.25,
                bgcolor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TableChartOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
          </ListItemIcon>
          <ListItemText
            primary="Excel (.xlsx)"
            secondary="Spreadsheet format"
            primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}
            secondaryTypographyProps={{ fontSize: '0.72rem', color: '#64748b' }}
          />
        </MenuItem>

        {/* PDF */}
        <MenuItem
          onClick={() => handleExport('pdf')}
          sx={{
            borderRadius: 1.5,
            py: 1,
            px: 1.5,
            gap: 1.25,
            '&:hover': { bgcolor: '#fef2f2' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 'auto !important' }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.25,
                bgcolor: '#fee2e2',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PictureAsPdfOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
          </ListItemIcon>
          <ListItemText
            primary="PDF Document (.pdf)"
            secondary="Formatted printable report"
            primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}
            secondaryTypographyProps={{ fontSize: '0.72rem', color: '#64748b' }}
          />
        </MenuItem>

        {/* CSV */}
        <MenuItem
          onClick={() => handleExport('csv')}
          sx={{
            borderRadius: 1.5,
            py: 1,
            px: 1.5,
            gap: 1.25,
            '&:hover': { bgcolor: '#eff6ff' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 'auto !important' }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.25,
                bgcolor: '#dbeafe',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DescriptionOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
          </ListItemIcon>
          <ListItemText
            primary="CSV (.csv)"
            secondary="Comma-separated values"
            primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}
            secondaryTypographyProps={{ fontSize: '0.72rem', color: '#64748b' }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}
