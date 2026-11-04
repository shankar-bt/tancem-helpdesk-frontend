import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import AddBoxOutlined from '@mui/icons-material/AddBoxOutlined';
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import FormatListBulleted from '@mui/icons-material/FormatListBulleted';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { paths } from '@/app/paths';
import { MASTER_CONFIGS } from '@/modules/core/masters/types';
import { useRoles } from '@/modules/core/roles/hooks/useRoles';
import TicketWorkflowModal from '@/modules/core/tickets/ui/TicketWorkflowModal';
import { isUserAdmin } from '@/shared/utils';
import { useAuthStore } from '@/stores/authStore';

export const SIDEBAR_WIDTH = 250;

interface NavChildItem {
  id: string;
  label: string;
  path: string;
  isSubActive?: (currentPath: string, searchStr: string) => boolean;
}

interface NavItemConfig {
  id: string;
  label: string;
  path?: string;
  icon: React.ReactNode;
  permissions?: string[];
  highlightColor?: string;
  isWorkflowAction?: boolean;
  children?: NavChildItem[];
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname, search } = useLocation();
  const currentUser = useAuthStore((s) => s.user);
  const { data: roles = [] } = useRoles();
  const isAdmin = isUserAdmin(currentUser, roles);
  const userPerms = currentUser?.permissions ?? [];

  const [masterOpen, setMasterOpen] = useState(pathname.startsWith('/masters'));
  const [workflowOpen, setWorkflowOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/masters')) {
      setMasterOpen(true);
    }
  }, [pathname]);

  const hasPerm = (...needed: string[]) => {
    if (isAdmin) return true;
    return needed.some((perm) => {
      if (userPerms.includes(perm)) return true;
      const lower = perm.toLowerCase();
      if (userPerms.some((up) => up.startsWith(lower + ':') || up === lower)) return true;
      return false;
    });
  };

  const isExactActive = (path: string) => pathname === path;

  // Fully dynamic navigation configuration
  const navigationItems: NavItemConfig[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: paths.dashboard,
      icon: <DashboardOutlined fontSize="small" />,
      permissions: ['dashboard:view', 'Dashboard'],
    },
    {
      id: 'tickets',
      label: 'Ticket List',
      path: paths.tickets,
      icon: <FormatListBulleted fontSize="small" />,
      permissions: ['tickets:view', 'tickets:create', 'Ticket List'],
    },
    {
      id: 'createTicket',
      label: 'Create Ticket',
      path: paths.createTicket,
      icon: <AddBoxOutlined fontSize="small" />,
      permissions: ['tickets:create', 'Create Ticket'],
      highlightColor: '#dc2626',
    },
    {
      id: 'workflow',
      label: 'Workflow Guide',
      icon: <AccountTreeOutlined fontSize="small" sx={{ color: '#60a5fa' }} />,
      isWorkflowAction: true,
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      path: paths.reports,
      icon: <AssessmentOutlined fontSize="small" />,
      permissions: ['reports:view', 'reports:create', 'reports:edit', 'reports:delete', 'Reports & Analytics', 'Reports'],
    },
    {
      id: 'users',
      label: 'User Management',
      path: paths.users,
      icon: <PeopleOutline fontSize="small" />,
      permissions: ['users:view', 'users:create', 'users:edit', 'users:delete', 'User Management'],
    },
    {
      id: 'masters',
      label: 'Master',
      icon: <CategoryOutlined fontSize="small" />,
      permissions: ['masters:view', 'masters:create', 'masters:edit', 'masters:delete', 'Master', 'Category Masters'],
      children: MASTER_CONFIGS.map((cfg) => ({
        id: cfg.type,
        label: cfg.label,
        path: paths.masterType(cfg.type),
        isSubActive: (currentPath, searchStr) => {
          if (currentPath !== '/masters') return false;
          const currentType = new URLSearchParams(searchStr).get('type') || 'support_category';
          return currentType === cfg.type;
        },
      })),
    },
    {
      id: 'roles',
      label: 'Roles & Permissions',
      path: paths.roles,
      icon: <SecurityOutlined fontSize="small" />,
      permissions: ['roles:view', 'roles:create', 'roles:edit', 'roles:delete', 'Roles & Permissions', 'Roles'],
    },
    {
      id: 'sla',
      label: 'SLA Policies',
      path: paths.sla,
      icon: <TimerOutlined fontSize="small" />,
      permissions: ['sla:view', 'sla:create', 'sla:edit', 'sla:delete', 'SLA Policies', 'SLA'],
    },
    {
      id: 'departments',
      label: 'Departments',
      path: paths.departments,
      icon: <ApartmentOutlined fontSize="small" />,
      permissions: ['departments:view', 'departments:create', 'departments:edit', 'departments:delete', 'Departments'],
    },
    {
      id: 'designations',
      label: 'Designations',
      path: paths.designations,
      icon: <BadgeOutlined fontSize="small" />,
      permissions: ['designations:view', 'designations:create', 'designations:edit', 'designations:delete', 'Designations'],
    },
  ], []);

  // Filter items dynamically based on current user permissions
  const visibleNavItems = useMemo(() => {
    return navigationItems.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) return true;
      return hasPerm(...item.permissions);
    });
  }, [navigationItems, userPerms, isAdmin]);

  return (
    <Box
      height="100%"
      bgcolor="#0a192f"
      color="#ffffff"
      display="flex"
      flexDirection="column"
      sx={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Brand Header */}
      <Box px={2.5} py={2} display="flex" alignItems="center" gap={1.5} sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Box
          component="img"
          src="/tancem-logo.png"
          alt="TANCEM Logo"
          sx={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            bgcolor: '#ffffff',
            p: '2px',
            objectFit: 'contain',
            boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
            flexShrink: 0,
          }}
        />
        <Box minWidth={0}>
          <Typography variant="subtitle1" component="span" letterSpacing="-0.01em" fontWeight={700} color="#ffffff" display="block" lineHeight={1.2} noWrap>
            TANCEM
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }} noWrap display="block">
            Helpdesk Portal
          </Typography>
        </Box>
      </Box>

      {/* Dynamic Nav List */}
      <List sx={{ px: 1.5, py: 1 }} component="nav" aria-label="Main navigation">
        {visibleNavItems.map((item) => {
          const hasChildren = Boolean(item.children && item.children.length > 0);
          const isExact = item.path ? isExactActive(item.path) : false;
          const isParentActive = hasChildren && pathname.startsWith('/masters');

          // 1. Collapsible Parent Item (e.g., Master with subcategories)
          if (hasChildren) {
            return (
              <Box key={item.id}>
                <ListItemButton
                  onClick={(e) => {
                    if (masterOpen) {
                      e.preventDefault();
                      setMasterOpen(false);
                    } else {
                      setMasterOpen(true);
                      onNavigate?.();
                    }
                  }}
                  selected={isParentActive}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    color: 'rgba(255,255,255,0.8)',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255,255,255,0.08)',
                      color: '#ffffff',
                    },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} slotProps={{ primary: { fontSize: 14.5, fontWeight: 500 } }} />
                  <Box sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', p: 0.5 }}>
                    {masterOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </Box>
                </ListItemButton>

                <Collapse in={masterOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 2 }}>
                    {item.children!.map((child) => {
                      const subActive = child.isSubActive ? child.isSubActive(pathname, search) : pathname === child.path;
                      return (
                        <ListItemButton
                          key={child.id}
                          component={NavLink}
                          to={child.path}
                          onClick={onNavigate}
                          selected={subActive}
                          sx={{
                            borderRadius: 1,
                            mb: 0.25,
                            py: 0.75,
                            color: 'rgba(255,255,255,0.7)',
                            '&.Mui-selected, &.Mui-selected:hover': {
                              bgcolor: 'rgba(255,255,255,0.14)',
                              color: '#ffffff',
                              fontWeight: 600,
                            },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                          }}
                        >
                          <ListItemText primary={child.label} slotProps={{ primary: { fontSize: 13.5 } }} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          }

          // 2. Action Button (e.g. Workflow Modal)
          if (item.isWorkflowAction) {
            return (
              <ListItemButton
                key={item.id}
                onClick={() => {
                  setWorkflowOpen(true);
                  onNavigate?.();
                }}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.5,
                  color: 'rgba(255,255,255,0.85)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.08)',
                    color: '#ffffff',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} slotProps={{ primary: { fontSize: 14.5, fontWeight: 500 } }} />
              </ListItemButton>
            );
          }

          // 3. Regular Navigation Item (e.g. Dashboard, Tickets, Reports, etc.)
          const isCustomHighlight = Boolean(item.highlightColor);

          return (
            <ListItemButton
              key={item.id}
              component={NavLink}
              to={item.path!}
              onClick={onNavigate}
              selected={isExact}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                color: isCustomHighlight
                  ? isExact
                    ? '#ffffff'
                    : 'rgba(255,255,255,0.85)'
                  : 'rgba(255,255,255,0.8)',
                bgcolor: isCustomHighlight
                  ? isExact
                    ? `${item.highlightColor} !important`
                    : 'transparent'
                  : undefined,
                '&.Mui-selected, &.Mui-selected:hover': isCustomHighlight
                  ? { bgcolor: `${item.highlightColor} !important`, color: '#ffffff' }
                  : { bgcolor: 'rgba(255,255,255,0.12)', color: '#ffffff' },
                '&:hover': isCustomHighlight
                  ? { bgcolor: isExact ? item.highlightColor : 'rgba(220,38,38,0.15)' }
                  : { bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    fontSize: 14.5,
                    fontWeight: isExact ? 600 : 500,
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <TicketWorkflowModal
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
      />
    </Box>
  );
}
