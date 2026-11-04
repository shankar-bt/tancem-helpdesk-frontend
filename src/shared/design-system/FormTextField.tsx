import TextField, { type OutlinedTextFieldProps } from '@mui/material/TextField';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

type Props<T extends FieldValues> = Omit<OutlinedTextFieldProps, 'name' | 'variant' | 'error' | 'value' | 'onChange'> & {
  name: Path<T>;
  control: Control<T, any>;
};

/** MUI TextField wired to React Hook Form, displaying Zod validation error messages. */
export default function FormTextField<T extends FieldValues>({ name, control, helperText, ...rest }: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...rest}
          {...field}
          variant="outlined"
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
        />
      )}
    />
  );
}
