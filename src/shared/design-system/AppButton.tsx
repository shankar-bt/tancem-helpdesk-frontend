import Button, { type ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { ElementType, ReactNode } from 'react';

export interface AppButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'contained' | 'outlined' | 'text' | 'danger';
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  component?: ElementType;
  to?: string;
}

export default function AppButton({
  variant = 'contained',
  loading = false,
  loadingText,
  icon,
  children,
  disabled,
  sx,
  ...props
}: AppButtonProps) {
  const isDanger = variant === 'danger';

  const muiVariant = isDanger ? 'contained' : variant;

  return (
    <Button
      {...props}
      variant={muiVariant}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={18} color="inherit" /> : icon || props.startIcon}
      sx={{
        textTransform: 'none',
        fontWeight: 500,
        position: 'relative',
        ...(isDanger && {
          bgcolor: 'error.main',
          color: 'error.contrastText',
          '&:hover': {
            bgcolor: 'error.dark',
          },
        }),
        ...sx,
      }}
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}
