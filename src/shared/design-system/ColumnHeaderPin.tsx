import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useState, type ReactNode } from 'react';
import type { PinDirection } from './useColumnPinning';

export interface ColumnHeaderPinProps {
  columnId: string;
  direction?: PinDirection;
  onPinChange: (colId: string, direction: PinDirection) => void;
  title?: string;
  align?: 'left' | 'center' | 'right';
  children?: ReactNode;
}

export default function ColumnHeaderPin({
  columnId,
  direction = 'none',
  onPinChange,
  title,
  align = 'left',
  children,
}: ColumnHeaderPinProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    setAnchorEl(null);
  };

  const handleSelect = (newDir: PinDirection, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    onPinChange(columnId, newDir);
    setAnchorEl(null);
  };

  const isLeft = direction === 'left';
  const isRight = direction === 'right';
  const isPinned = isLeft || isRight;

  const tooltipText = isLeft
    ? 'Pinned to Left (Click to change or unpin)'
    : isRight
      ? 'Pinned to Right (Click to change or unpin)'
      : 'Pin Column';

  const pinButton = (
    <>
      <Tooltip title={tooltipText} arrow enterDelay={400}>
        <IconButton
          size="small"
          onClick={handleClick}
          aria-label={tooltipText}
          sx={{
            width: 22,
            height: 22,
            p: 0.25,
            flexShrink: 0,
            borderRadius: 1,
            transition: 'all 120ms ease',
            ...(isLeft
              ? {
                  bgcolor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  '&:hover': { bgcolor: '#dbeafe', borderColor: '#93c5fd' },
                }
              : isRight
                ? {
                    bgcolor: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    color: '#4338ca',
                    '&:hover': { bgcolor: '#e0e7ff', borderColor: '#a5b4fc' },
                  }
                : {
                    bgcolor: 'transparent',
                    border: '1px solid transparent',
                    color: '#94a3b8',
                    opacity: 0.7,
                    '&:hover': {
                      opacity: 1,
                      bgcolor: 'rgba(0,0,0,0.04)',
                      borderColor: '#cbd5e1',
                      color: '#334155',
                    },
                  }),
          }}
        >
          {isPinned ? (
            <PushPinIcon
              sx={{
                fontSize: 14,
                transform: isLeft ? 'rotate(-45deg)' : isRight ? 'rotate(45deg)' : 'none',
              }}
            />
          ) : (
            <PushPinOutlinedIcon sx={{ fontSize: 14 }} />
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleClose()}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: align === 'right' ? 'right' : 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: align === 'right' ? 'right' : 'left', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              minWidth: 175,
              borderRadius: 2,
              mt: 0.5,
              border: '1px solid #e2e8f0',
              p: 0.5,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
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
            {title ? `Pin: ${title}` : 'Pin Column'}
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={(e) => handleSelect('left', e)}
          selected={isLeft}
          sx={{ borderRadius: 1.5, py: 0.75, fontSize: '0.8125rem', gap: 1 }}
        >
          <ArrowBackIcon sx={{ fontSize: 16, color: isLeft ? '#1d4ed8' : 'text.secondary' }} />
          <ListItemText
            primaryTypographyProps={{
              fontSize: '0.8125rem',
              fontWeight: isLeft ? 600 : 400,
              color: isLeft ? '#1d4ed8' : 'inherit',
            }}
          >
            Pin to Left
          </ListItemText>
          {isLeft && <CheckIcon sx={{ fontSize: 16, color: '#1d4ed8' }} />}
        </MenuItem>
        <MenuItem
          onClick={(e) => handleSelect('right', e)}
          selected={isRight}
          sx={{ borderRadius: 1.5, py: 0.75, fontSize: '0.8125rem', gap: 1 }}
        >
          <ArrowForwardIcon sx={{ fontSize: 16, color: isRight ? '#4338ca' : 'text.secondary' }} />
          <ListItemText
            primaryTypographyProps={{
              fontSize: '0.8125rem',
              fontWeight: isRight ? 600 : 400,
              color: isRight ? '#4338ca' : 'inherit',
            }}
          >
            Pin to Right
          </ListItemText>
          {isRight && <CheckIcon sx={{ fontSize: 16, color: '#4338ca' }} />}
        </MenuItem>
        {isPinned && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={(e) => handleSelect('none', e)}
              sx={{ borderRadius: 1.5, py: 0.75, fontSize: '0.8125rem', gap: 1 }}
            >
              <CloseIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <ListItemText
                primaryTypographyProps={{
                  fontSize: '0.8125rem',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                Unpin Column
              </ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );

  if (!children) {
    return pinButton;
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent:
          align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'space-between',
        width: '100%',
        gap: 0.75,
      }}
    >
      <Box
        component="span"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: align === 'left' ? 1 : undefined,
        }}
      >
        {children}
      </Box>
      {pinButton}
    </Box>
  );
}
