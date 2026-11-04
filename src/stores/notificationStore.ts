import { create } from 'zustand';

export type NotificationSeverity = 'success' | 'error' | 'info' | 'warning';

interface NotificationState {
  open: boolean;
  message: string;
  severity: NotificationSeverity;
  notify: (message: string, severity?: NotificationSeverity) => void;
  close: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  open: false,
  message: '',
  severity: 'success',
  notify: (message, severity = 'success') => set({ open: true, message, severity }),
  close: () => set({ open: false }),
}));
