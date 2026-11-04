import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '../types/api.types';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'Cannot reach the server. Check your connection and that the API is running.';
    const body = error.response.data;
    if (body?.errors?.length) return body.errors.map((e) => e.message).join(' ');
    if (body?.message) return body.message;
  }
  return fallback;
}
