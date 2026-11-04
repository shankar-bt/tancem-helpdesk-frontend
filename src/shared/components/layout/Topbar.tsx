import FullscreenExitOutlined from '@mui/icons-material/FullscreenExitOutlined';
import FullscreenOutlined from '@mui/icons-material/FullscreenOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { useLogout } from '@/modules/core/auth/hooks/useAuth';
import { useRoles } from '@/modules/core/roles/hooks/useRoles';
import { useDepartments } from '@/modules/core/departments/hooks/useDepartments';
import { useDesignations } from '@/modules/core/designation/hooks/useDesignation';
import ConfirmDialog from '@/shared/design-system/ConfirmDialog';
import { initials } from '@/shared/utils/format';
import {
  isUserAdmin,
  isUserManager,
  isUserAgent,
  getRoleLabel,
  getUserTypeLabel,
} from '@/shared/utils';
import { useAuthStore } from '@/stores/authStore';
import NotificationMenu from './NotificationMenu';
import { SIDEBAR_WIDTH } from './Sidebar';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { data: roles = [] } = useRoles();
  const { data: departments = [] } = useDepartments();
  const { data: designationsData } = useDesignations({ page: 1, limit: 100 });
  const logout = useLogout();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setAnchor(event.currentTarget);
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setAnchor(null);
    }, 600);
  };

  const handlePopoverEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handlePopoverLeave = () => {
    if (isPinned) return;
    handleMouseLeave();
  };

  const handleClose = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setAnchor(null);
    setIsPinned(false);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

  const isAdmin = isUserAdmin(user, roles);
  const isManager = isUserManager(user, roles);
  const isAgent = isUserAgent(user, roles);

  const displayRoleLabel = getRoleLabel(user, roles);
  const displayUserType = getUserTypeLabel(user, roles);

  const departmentName =
    departments.find((d) => d.id === user?.departmentId)?.name ||
    (user as any)?.department?.name ||
    (user as any)?.department ||
    (user as any)?.departmentName ||
    null;

  const designationTitle =
    designationsData?.items?.find((d) => d.id === user?.designationId)?.title ||
    (user as any)?.designation?.title ||
    (user as any)?.designation ||
    (user as any)?.designationName ||
    null;

  return (
    <AppBar
      position="fixed"
      color="inherit"
      sx={{
        width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { md: `${SIDEBAR_WIDTH}px` },
        borderBottom: 1,
        borderColor: 'divider',
        boxShadow: 'none',
        bgcolor: 'background.paper',
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 1.5, sm: 2.5 } }}>
        <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1, display: { md: 'none' } }} aria-label="Open navigation">
          <MenuIcon />
        </IconButton>

        {/* Mobile Logo */}
        <Box display={{ xs: 'flex', md: 'none' }} alignItems="center" gap={1} mr={1}>
          <Box
            component="img"
            src="/tancem-logo.png"
            alt="TANCEM Logo"
            sx={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'contain' }}
          />
        </Box>

        {/* Welcome Username with Animated Waving Hand */}
        {user && (
          <Box display="flex" alignItems="center" sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: '#1e293b',
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.05rem' },
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                whiteSpace: 'nowrap',
              }}
            >
              <span>Welcome,</span>
              <Box
                component="span"
                sx={{
                  fontWeight: 700,
                  color: '#1e3a8a',
                  textTransform: 'capitalize',
                }}
              >
                {user.name}
              </Box>
              <Box
                component="span"
                role="img"
                aria-label="waving hand"
                sx={{
                  display: 'inline-block',
                  fontSize: { xs: '1.15rem', sm: '1.3rem' },
                  transformOrigin: '70% 70%',
                  animation: 'waveHand 2.2s infinite',
                  '@keyframes waveHand': {
                    '0%': { transform: 'rotate(0deg)' },
                    '10%': { transform: 'rotate(14deg)' },
                    '20%': { transform: 'rotate(-8deg)' },
                    '30%': { transform: 'rotate(14deg)' },
                    '40%': { transform: 'rotate(-4deg)' },
                    '50%': { transform: 'rotate(10deg)' },
                    '60%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(0deg)' },
                  },
                }}
              >
                👋
              </Box>
            </Typography>
          </Box>
        )}

        <Box flexGrow={1} />

        {user && (
          <Stack direction="row" alignItems="center" spacing={{ xs: 0.75, sm: 1.25 }}>
            {/* Full Screen Shortcut Button */}
            <Tooltip title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen Mode (Shortcut / F11)'} arrow>
              <IconButton
                onClick={toggleFullscreen}
                size="small"
                sx={{
                  color: isFullscreen ? '#2563eb' : '#64748b',
                  bgcolor: isFullscreen ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  p: 0.9,
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: isFullscreen ? 'rgba(37, 99, 235, 0.25)' : 'rgba(226, 232, 240, 0.9)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(37, 99, 235, 0.1)',
                    color: '#1d4ed8',
                    borderColor: 'rgba(37, 99, 235, 0.35)',
                    transform: 'scale(1.05)',
                  },
                }}
                aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
              >
                {isFullscreen ? (
                  <FullscreenExitOutlined sx={{ fontSize: 21 }} />
                ) : (
                  <FullscreenOutlined sx={{ fontSize: 21 }} />
                )}
              </IconButton>
            </Tooltip>

            {/* Notification Bell Menu */}
            <NotificationMenu />

            {/* User Profile Avatar Button (Hover or Click to view details) */}
            <IconButton
              onClick={(e) => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                if (anchor && isPinned) {
                  handleClose();
                } else {
                  setAnchor(e.currentTarget);
                  setIsPinned(true);
                }
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              aria-label="User profile details"
              size="small"
              sx={{
                p: 0.5,
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'scale(1.05)' },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                  border: '2px solid',
                  borderColor: Boolean(anchor) ? 'primary.light' : 'transparent',
                  transition: 'border-color 0.2s ease',
                }}
              >
                {initials(user.name)}
              </Avatar>
            </IconButton>

            <Popover
              anchorEl={anchor}
              open={Boolean(anchor)}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              disableRestoreFocus
              sx={{
                pointerEvents: isPinned ? 'auto' : 'none',
              }}
              slotProps={{
                backdrop: {
                  sx: {
                    bgcolor: 'transparent',
                    pointerEvents: isPinned ? 'auto' : 'none',
                  },
                },
                paper: {
                  elevation: 8,
                  onMouseEnter: handlePopoverEnter,
                  onMouseLeave: handlePopoverLeave,
                  sx: {
                    pointerEvents: 'auto',
                    minWidth: 280,
                    maxWidth: 320,
                    mt: 0.5,
                    borderRadius: 2.5,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
                    overflow: 'visible',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -12,
                      left: 0,
                      right: 0,
                      height: 12,
                      bgcolor: 'transparent',
                    },
                  },
                },
              }}
            >
              {/* User details header */}
              <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: '#22c55e',
                        color: '#22c55e',
                        boxShadow: '0 0 0 2px #fff',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                      },
                    }}
                  >
                    <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontSize: 16, fontWeight: 700 }}>
                      {initials(user.name)}
                    </Avatar>
                  </Badge>
                  <Box minWidth={0} flex={1}>
                    <Typography variant="subtitle2" fontWeight={700} color="#0f172a" noWrap>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#f8fafc',
                    borderRadius: 2,
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.25,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="#64748b" fontWeight={600}>
                      Role
                    </Typography>
                    <Chip
                      label={displayRoleLabel}
                      size="small"
                      color={isAdmin ? 'primary' : isManager ? 'warning' : isAgent ? 'secondary' : 'default'}
                      variant={isAdmin || isManager ? 'filled' : 'outlined'}
                      sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                    />
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="#64748b" fontWeight={600}>
                      User Type
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="#1e293b">
                      {displayUserType}
                    </Typography>
                  </Box>

                  {designationTitle && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="#64748b" fontWeight={600}>
                        Designation
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="#1e293b" noWrap sx={{ maxWidth: 160 }} title={designationTitle}>
                        {designationTitle}
                      </Typography>
                    </Box>
                  )}

                  {departmentName && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="#64748b" fontWeight={600}>
                        Department
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="#1e293b" noWrap sx={{ maxWidth: 160 }} title={departmentName}>
                        {departmentName}
                      </Typography>
                    </Box>
                  )}

                  {user.officeCategory && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="#64748b" fontWeight={600}>
                        Office
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="primary.main">
                        {user.officeCategory}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Divider sx={{ borderColor: '#f1f5f9' }} />

              <Box sx={{ p: 1 }}>
                <Button
                  fullWidth
                  onClick={() => {
                    handleClose();
                    setLogoutDialogOpen(true);
                  }}
                  startIcon={<LogoutOutlined fontSize="small" />}
                  sx={{
                    py: 1,
                    px: 2,
                    justifyContent: 'flex-start',
                    color: '#dc2626',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    borderRadius: 1.5,
                    textTransform: 'none',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: '#fef2f2',
                      color: '#b91c1c',
                    },
                  }}
                >
                  Sign out
                </Button>
              </Box>
            </Popover>

            {/* Logout Confirmation Dialog */}
            <ConfirmDialog
              open={logoutDialogOpen}
              title="Confirm Logout"
              message="Do you want to logout?"
              confirmLabel="Logout"
              onConfirm={() => {
                setLogoutDialogOpen(false);
                void logout();
              }}
              onClose={() => setLogoutDialogOpen(false)}
            />
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
}
