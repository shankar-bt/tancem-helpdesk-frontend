import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useNotificationStore } from '@/stores/notificationStore';

export default function Notifier() {
  const { open, message, severity, close } = useNotificationStore();

  return (
    <Snackbar open={open} autoHideDuration={4000} onClose={close} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert onClose={close} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
