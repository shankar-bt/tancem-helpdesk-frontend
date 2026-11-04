import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useForm } from 'react-hook-form';
import { FormTextField } from '@/shared/design-system';
import { getErrorMessage } from '@/shared/utils/errors';
import { useLogin } from '../hooks/useAuth';
import { loginSchema, type LoginFormValues } from '../types';

export default function LoginPage() {
  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const login = useLogin();

  return (
    <Stack component="form" gap={2.5} onSubmit={handleSubmit((values) => login.mutate(values))} noValidate>
      <div>
        <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
          <Box
            component="img"
            src="/tancem-logo.png"
            alt="TANCEM Logo"
            sx={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'contain' }}
          />
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              TANCEM
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Corporate Support & Helpdesk
            </Typography>
          </Box>
        </Box>
        <Typography variant="h5" component="h1">
          Sign in
        </Typography>
        <Typography color="text.secondary" mt={0.5}>
          Use the email and password for your account.
        </Typography>
      </div>

      {login.isError && <Alert severity="error">{getErrorMessage(login.error)}</Alert>}

      <FormTextField control={control} name="email" label="Email" type="email" autoComplete="email" autoFocus />
      <FormTextField control={control} name="password" label="Password" type="password" autoComplete="current-password" />

      <Button type="submit" variant="contained" size="large" disabled={login.isPending}>
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
        Need access? Please contact your <strong>IT Administrator</strong> or Department Coordinator.
      </Typography>
    </Stack>
  );
}
