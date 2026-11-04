import { z } from 'zod';

export const validationRules = {
  requiredString: (message = 'This field is required') =>
    z.string().trim().min(1, message),

  email: (message = 'Enter a valid email address') =>
    z.string().trim().min(1, 'Email is required').email(message),

  password: (minLength = 8, message = `Password must be at least ${minLength} characters`) =>
    z.string().min(minLength, message),

  optionalPassword: (minLength = 8, message = `Password must be at least ${minLength} characters`) =>
    z.string().refine((val) => val === '' || val.length >= minLength, message),
};
