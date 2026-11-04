import Box from '@mui/material/Box';
import Card, { type CardProps } from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export interface AppCardProps extends Omit<CardProps, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  contentSx?: CardProps['sx'];
  disablePadding?: boolean;
}

export default function AppCard({
  title,
  subtitle,
  action,
  children,
  contentSx,
  disablePadding = false,
  sx,
  ...props
}: AppCardProps) {
  const hasHeader = Boolean(title || subtitle || action);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        bgcolor: '#ffffff',
        ...sx,
      }}
      {...props}
    >
      {hasHeader && (
        <>
          <Box
            p={2.5}
            display="flex"
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={1}
          >
            <Box>
              {typeof title === 'string' ? (
                <Typography variant="h6" fontWeight={600}>
                  {title}
                </Typography>
              ) : (
                title
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary" mt={0.25}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {action && <Box>{action}</Box>}
          </Box>
          <Divider />
        </>
      )}
      <CardContent sx={{ p: disablePadding ? 0 : 3, '&:last-child': { pb: disablePadding ? 0 : 3 }, ...contentSx }}>
        {children}
      </CardContent>
    </Card>
  );
}
