import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { paths } from '@/app/paths';
import { MASTER_CONFIGS } from '@/modules/core/masters/types';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbsNavigationProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  tickets: 'Tickets',
  create: 'Raise Ticket',
  departments: 'Departments',
  users: 'Users',
  new: 'Add User',
  edit: 'Edit User',
  roles: 'Roles & Permissions',
  sla: 'SLA Policies',
  designations: 'Designations',
  masters: 'Masters',
};

export default function BreadcrumbsNavigation({ items: customItems, className }: BreadcrumbsNavigationProps) {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    if (customItems && customItems.length > 0) {
      return customItems;
    }

    const { pathname, search } = location;
    const items: BreadcrumbItem[] = [
      {
        label: 'Home',
        path: paths.dashboard,
        icon: <HomeOutlinedIcon sx={{ mr: 0.5, fontSize: 17 }} />,
      },
    ];

    if (pathname === '/' || pathname === paths.dashboard) {
      items.push({ label: 'Dashboard' });
      return items;
    }

    // Split path into segments
    const segments = pathname.split('/').filter(Boolean);
    let accumulatedPath = '';

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      accumulatedPath += `/${segment}`;
      const isLast = i === segments.length - 1;

      // Check if segment is an ID (UUID, numeric, or hex hash)
      const isId =
        segment.length > 20 ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
        /^\d+$/.test(segment);

      if (isId) {
        // Skip adding raw UUID to breadcrumbs, next segment might be 'edit'
        continue;
      }

      const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      // Handle specific parent routing
      let targetPath = accumulatedPath;
      if (segment === 'create' && segments[0] === 'tickets') {
        targetPath = paths.createTicket;
      }

      items.push({
        label,
        path: isLast ? undefined : targetPath,
      });
    }

    // Handle master query param if on /masters?type=...
    if (pathname === paths.masters && search) {
      const params = new URLSearchParams(search);
      const masterType = params.get('type');
      if (masterType) {
        // Update previous item to be clickable
        if (items.length > 1) {
          items[items.length - 1].path = paths.masters;
        }
        const masterConfig = MASTER_CONFIGS.find((m) => m.type === masterType);
        items.push({
          label: masterConfig ? masterConfig.label : masterType.replace(/_/g, ' '),
        });
      }
    }

    return items;
  }, [customItems, location]);

  return (
    <Box
      className={className}
      sx={{
        mb: 2.5,
        display: 'flex',
        alignItems: 'center',
        py: 0.5,
      }}
      aria-label="Breadcrumb navigation"
    >
      <Breadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
        sx={{
          '& .MuiBreadcrumbs-ol': {
            alignItems: 'center',
          },
          '& .MuiBreadcrumbs-li': {
            display: 'inline-flex',
            alignItems: 'center',
          },
        }}
      >
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          if (isLast || !item.path) {
            return (
              <Typography
                key={item.label + index}
                variant="body2"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: '0.875rem',
                }}
              >
                {item.icon}
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={item.label + index}
              component={RouterLink}
              to={item.path}
              underline="hover"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                color: 'text.secondary',
                fontSize: '0.875rem',
                transition: 'color 150ms ease',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
