import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AppButton from '../AppButton';

export interface FormActionsProps {
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  disabled?: boolean;
  onCancel?: () => void;
  cancelTo?: string;
  extra?: ReactNode;
  align?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
}

export default function FormActions({
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  submitting = false,
  disabled = false,
  onCancel,
  cancelTo,
  extra,
  align = 'flex-end',
}: FormActionsProps) {
  return (
    <Box mt={3} pt={2}>
      <Stack direction="row" spacing={1.5} justifyContent={align} alignItems="center">
        {extra && <Box mr="auto">{extra}</Box>}

        {(onCancel || cancelTo) && (
          <AppButton
            variant="outlined"
            color="inherit"
            disabled={submitting || disabled}
            onClick={onCancel}
            component={cancelTo ? RouterLink : undefined}
            to={cancelTo}
          >
            {cancelLabel}
          </AppButton>
        )}

        <AppButton type="submit" variant="contained" loading={submitting} disabled={disabled}>
          {submitLabel}
        </AppButton>
      </Stack>
    </Box>
  );
}
