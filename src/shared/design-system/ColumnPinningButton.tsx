import CloseIcon from '@mui/icons-material/Close';
import PushPin from '@mui/icons-material/PushPin';
import PushPinOutlined from '@mui/icons-material/PushPinOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';
import type { ColumnPinConfig, PinDirection } from './useColumnPinning';

export interface ColumnPinningButtonProps {
  columns: ColumnPinConfig[];
  pins: Record<string, PinDirection>;
  onPinChange: (colId: string, direction: PinDirection) => void;
  onReset: () => void;
  size?: 'small' | 'medium';
}

export default function ColumnPinningButton({
  columns,
  pins,
  onPinChange,
  onReset,
  size = 'small',
}: ColumnPinningButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const pinnedCount = Object.values(pins).filter((p) => p !== 'none').length;

  return (
    <>
      <Tooltip title="Configure sticky / frozen columns">
        <Badge
          badgeContent={pinnedCount > 0 ? pinnedCount : 0}
          color="primary"
          variant="standard"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.65rem',
              height: 16,
              minWidth: 16,
              top: 4,
              right: 4,
            },
          }}
        >
          <Button
            size={size}
            variant="outlined"
            onClick={handleClick}
            startIcon={pinnedCount > 0 ? <PushPin sx={{ fontSize: 16 }} /> : <PushPinOutlined sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8125rem',
              borderColor: pinnedCount > 0 ? '#93c5fd' : '#cbd5e1',
              color: pinnedCount > 0 ? '#1d4ed8' : '#475569',
              bgcolor: pinnedCount > 0 ? '#eff6ff' : 'transparent',
              '&:hover': {
                borderColor: '#93c5fd',
                bgcolor: '#f1f5f9',
              },
            }}
          >
            Pin Columns
          </Button>
        </Badge>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              width: 340,
              p: 2,
              borderRadius: 2,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
            },
          },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <PushPin sx={{ color: '#2563eb', fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
              Sticky Columns
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={handleClose}
            sx={{ minWidth: 28, p: 0.5, color: '#94a3b8', '&:hover': { color: '#0f172a' } }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Choose which columns remain fixed when scrolling horizontally.
        </Typography>

        <Divider sx={{ mb: 1.5 }} />

        <Stack spacing={1.25} sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
          {columns.map((col) => {
            const currentPin = pins[col.id] || 'none';
            return (
              <Box
                key={col.id}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  py: 0.5,
                  px: 1,
                  borderRadius: 1,
                  bgcolor: currentPin !== 'none' ? '#f8fafc' : 'transparent',
                }}
              >
                <Typography variant="body2" fontWeight={currentPin !== 'none' ? 600 : 500} color="#334155" noWrap sx={{ maxWidth: 140 }}>
                  {col.label}
                </Typography>

                <ToggleButtonGroup
                  size="small"
                  value={currentPin}
                  exclusive
                  onChange={(_, val) => {
                    if (val) onPinChange(col.id, val as PinDirection);
                  }}
                  sx={{
                    height: 26,
                    '& .MuiToggleButton-root': {
                      px: 0.9,
                      py: 0,
                      fontSize: '0.675rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      borderColor: '#e2e8f0',
                      '&.Mui-selected': {
                        bgcolor: '#2563eb',
                        color: '#fff',
                        '&:hover': {
                          bgcolor: '#1d4ed8',
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="none" title="Normal scrollable">
                    None
                  </ToggleButton>
                  <ToggleButton value="left" title="Freeze to Left edge">
                    Left
                  </ToggleButton>
                  <ToggleButton value="right" title="Freeze to Right edge">
                    Right
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            );
          })}
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button
            size="small"
            startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />}
            onClick={onReset}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              color: '#64748b',
              '&:hover': { color: '#0f172a' },
            }}
          >
            Reset Defaults
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={handleClose}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 1.5,
              px: 2,
            }}
          >
            Done
          </Button>
        </Box>
      </Popover>
    </>
  );
}
