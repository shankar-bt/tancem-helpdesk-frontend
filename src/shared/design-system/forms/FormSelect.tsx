import MenuItem from '@mui/material/MenuItem';
import TextField, { type OutlinedTextFieldProps } from '@mui/material/TextField';
import type { ReactNode } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

export interface SelectOption {
  label: ReactNode;
  value: string | number;
}

type Props<T extends FieldValues> = Omit<
  OutlinedTextFieldProps,
  'name' | 'variant' | 'error' | 'value' | 'onChange' | 'select'
> & {
  name: Path<T>;
  control: Control<T, any>;
  options?: SelectOption[];
  children?: ReactNode;
};

export default function FormSelect<T extends FieldValues>({
  name,
  control,
  options,
  children,
  helperText,
  ...rest
}: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          select
          {...rest}
          {...field}
          variant="outlined"
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
        >
          {options
            ? options.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))
            : children}
        </TextField>
      )}
    />
  );
}
