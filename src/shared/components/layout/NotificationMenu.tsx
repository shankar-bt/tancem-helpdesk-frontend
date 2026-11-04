import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useClearReadNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/modules/core/notifications/hooks/useNotifications';
import type { NotificationItem } from '@/modules/core/notifications/types';

function formatRelativeTime(dateStr: string | Date): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'ticket_assigned':
      return <AssignmentIndOutlinedIcon sx={{ color: '#7c3aed', fontSize: 18 }} />;
    case 'ticket_created':
      return <ConfirmationNumberOutlinedIcon sx={{ color: '#2563eb', fontSize: 18 }} />;
    case 'ticket_resolved':
      return <CheckCircleOutlineIcon sx={{ color: '#16a34a', fontSize: 18 }} />;
    case 'comment_added':
      return <ChatBubbleOutlineIcon sx={{ color: '#4f46e5', fontSize: 18 }} />;
    default:
      return <ConfirmationNumberOutlinedIcon sx={{ color: '#64748b', fontSize: 18 }} />;
  }
}

export default function NotificationMenu() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [filter, setFilter] = useState<'unread' | 'all'>('unread');

  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const clearRead = useClearReadNotifications();

  const allNotifications = data?.items || [];
  const unreadCount = data?.unreadCount || 0;
  const unreadNotifications = allNotifications.filter((n) => !n.isRead);
  const displayedNotifications = filter === 'unread' ? unreadNotifications : allNotifications;

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markRead.mutate(item.id);
    }
    handleClose();
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllRead.mutate();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title={unreadCount > 0 ? `${unreadCount} unread notification(s)` : 'Notifications'} arrow>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            mr: 1.5,
            color: unreadCount > 0 ? '#1e293b' : '#64748b',
            bgcolor: open ? '#f1f5f9' : 'transparent',
            transition: 'all 0.2s ease',
            '@keyframes bellRing': {
              '0%': { transform: 'rotate(0deg)' },
              '15%': { transform: 'rotate(15deg)' },
              '30%': { transform: 'rotate(-15deg)' },
              '45%': { transform: 'rotate(10deg)' },
              '60%': { transform: 'rotate(-10deg)' },
              '75%': { transform: 'rotate(4deg)' },
              '85%': { transform: 'rotate(-4deg)' },
              '100%': { transform: 'rotate(0deg)' },
            },
            '&:hover': {
              bgcolor: '#f1f5f9',
              color: '#1e3a8a',
              '& .bell-icon': {
                animation: 'bellRing 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) both infinite',
                transformOrigin: 'top center',
              },
            },
          }}
          aria-label="notifications"
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                height: 18,
                minWidth: 18,
                fontWeight: 700,
              },
            }}
          >
            <NotificationsNoneOutlinedIcon fontSize="small" className="bell-icon" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxHeight: 460,
              borderRadius: 2.5,
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            pt: 1.5,
            pb: 1.25,
            bgcolor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.25}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Box
                  component="span"
                  sx={{
                    bgcolor: '#fee2e2',
                    color: '#991b1b',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    px: 0.8,
                    py: 0.15,
                    borderRadius: 1,
                  }}
                >
                  {unreadCount} new
                </Box>
              )}
            </Box>

            {filter === 'unread' && unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllRead}
                startIcon={<DoneAllIcon sx={{ fontSize: 14 }} />}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  p: 0.4,
                  '&:hover': { bgcolor: '#eff6ff' },
                }}
              >
                Mark all read
              </Button>
            )}

            {filter === 'all' && allNotifications.some((n) => n.isRead) && (
              <Button
                size="small"
                onClick={() => clearRead.mutate()}
                startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#dc2626',
                  p: 0.4,
                  '&:hover': { bgcolor: '#fef2f2' },
                }}
              >
                Clear read
              </Button>
            )}
          </Box>

          {/* Unread / All Filter Tabs */}
          <Stack direction="row" spacing={0.75}>
            <Button
              size="small"
              onClick={() => setFilter('unread')}
              sx={{
                py: 0.25,
                px: 1.2,
                fontSize: '0.72rem',
                fontWeight: filter === 'unread' ? 700 : 500,
                color: filter === 'unread' ? '#1d4ed8' : '#64748b',
                bgcolor: filter === 'unread' ? '#eff6ff' : 'transparent',
                borderRadius: '6px',
                border: filter === 'unread' ? '1px solid #bfdbfe' : '1px solid transparent',
                textTransform: 'none',
                minWidth: 0,
              }}
            >
              Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
            </Button>
            <Button
              size="small"
              onClick={() => setFilter('all')}
              sx={{
                py: 0.25,
                px: 1.2,
                fontSize: '0.72rem',
                fontWeight: filter === 'all' ? 700 : 500,
                color: filter === 'all' ? '#1d4ed8' : '#64748b',
                bgcolor: filter === 'all' ? '#eff6ff' : 'transparent',
                borderRadius: '6px',
                border: filter === 'all' ? '1px solid #bfdbfe' : '1px solid transparent',
                textTransform: 'none',
                minWidth: 0,
              }}
            >
              All ({allNotifications.length})
            </Button>
          </Stack>
        </Box>

        {/* Content List */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={5}>
              <CircularProgress size={24} />
            </Box>
          ) : displayedNotifications.length === 0 ? (
            <Box py={5} px={3} textAlign="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: filter === 'unread' ? '#ecfdf5' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.5,
                  color: filter === 'unread' ? '#10b981' : '#94a3b8',
                }}
              >
                {filter === 'unread' ? (
                  <CheckCircleOutlineIcon sx={{ fontSize: 24 }} />
                ) : (
                  <NotificationsNoneOutlinedIcon sx={{ fontSize: 24 }} />
                )}
              </Box>
              <Typography variant="body2" fontWeight={700} color="#0f172a">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {filter === 'unread'
                  ? 'No unread notifications at the moment.'
                  : 'You will be notified when tickets are raised, assigned, or updated.'}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {displayedNotifications.map((item, idx) => (
                <Box key={item.id}>
                  {idx > 0 && <Divider />}
                  <ListItemButton
                    onClick={() => handleItemClick(item)}
                    sx={{
                      px: 2,
                      py: 1.25,
                      alignItems: 'flex-start',
                      bgcolor: item.isRead ? 'transparent' : '#f8faff',
                      transition: 'background-color 0.15s ease',
                      '&:hover': { bgcolor: '#f1f5f9' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    >
                      {getNotificationIcon(item.type)}
                    </Box>

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.25}>
                        <Typography
                          variant="caption"
                          fontWeight={item.isRead ? 600 : 700}
                          color={item.isRead ? '#334155' : '#0f172a'}
                          noWrap
                        >
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', ml: 1, flexShrink: 0 }}>
                          {formatRelativeTime(item.createdAt)}
                        </Typography>
                      </Box>

                      <Typography
                        variant="caption"
                        color="#64748b"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.35,
                          fontSize: '0.74rem',
                        }}
                      >
                        {item.message}
                      </Typography>
                    </Box>

                    {!item.isRead && (
                      <Box
                        sx={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          bgcolor: '#2563eb',
                          ml: 1,
                          mt: 1,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </ListItemButton>
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}
