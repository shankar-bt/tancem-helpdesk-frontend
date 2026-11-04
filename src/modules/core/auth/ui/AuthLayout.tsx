import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <Box display="grid" minHeight="100vh" gridTemplateColumns={{ xs: '1fr', md: '5fr 6fr' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: 6,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            component="img"
            src="/tancem-logo.png"
            alt="TANCEM"
            sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: '#ffffff', p: '2px', objectFit: 'contain' }}
          />
          <Typography variant="h6" component="span" fontWeight={700}>
            TANCEM Helpdesk
          </Typography>
        </Box>
        <Box maxWidth={420}>
          <Typography variant="h4" component="p" lineHeight={1.25}>
            Corporate Ticketing & Helpdesk System
          </Typography>
          <Typography mt={2} sx={{ opacity: 0.75 }}>
            Monitor, assign, and resolve user support requests with automated SLA tracking.
          </Typography>
        </Box>
        <Box />
      </Box>

      <Box display="flex" alignItems="center" justifyContent="center" p={{ xs: 2, sm: 4 }}>
        <Paper variant="outlined" sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 } }}>
          <Outlet />
        </Paper>
      </Box>
    </Box>
  );
}
