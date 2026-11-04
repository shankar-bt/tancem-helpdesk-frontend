import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export default function LoadingBlock() {
  return (
    <Box display="flex" justifyContent="center" py={8}>
      <CircularProgress size={28} aria-label="Loading" />
    </Box>
  );
}
