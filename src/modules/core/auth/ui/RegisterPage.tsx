import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { paths } from '@/app/paths';
import { FormTextField } from '@/shared/design-system';
import { getErrorMessage } from '@/shared/utils/errors';
import { useRegister } from '../hooks/useAuth';
import { registerSchema, type RegisterFormValues } from '../types';

export default function RegisterPage() {
  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });
  const register = useRegister();

  return (
    <Stack
      component="form"
      gap={2.5}
      onSubmit={handleSubmit(({ confirmPassword: _confirm, ...payload }) => register.mutate(payload))}
      noValidate
    >
      <div>
        <Typography variant="h5" component="h1">
          Create your account
        </Typography>
        <Typography color="text.secondary" mt={0.5}>
          The first account created becomes the administrator.
        </Typography>
      </div>

      {register.isError && <Alert severity="error">{getErrorMessage(register.error)}</Alert>}

      <FormTextField control={control} name="name" label="Full name" autoComplete="name" autoFocus />
      <FormTextField control={control} name="email" label="Email" type="email" autoComplete="email" />
      <FormTextField
        control={control}
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        helperText="At least 8 characters."
      />
      <FormTextField control={control} name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" />

      <Button type="submit" variant="contained" size="large" disabled={register.isPending}>
        {register.isPending ? 'Creating account…' : 'Create account'}
      </Button>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        Already registered?{' '}
        <Link component={RouterLink} to={paths.login}>
          Sign in
        </Link>
      </Typography>
    </Stack>
  );
}
