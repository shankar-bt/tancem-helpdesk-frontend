import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#17414d', dark: '#0f2d36', light: '#2d6475', contrastText: '#ffffff' },
    secondary: { main: '#b07d1c' },
    background: { default: '#f3f4f2', paper: '#ffffff' },
    text: { primary: '#1c2528', secondary: '#55636a' },
    divider: '#dde2df',
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600, letterSpacing: '-0.005em' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiTextField: { defaultProps: { fullWidth: true, size: 'medium' } },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: '#55636a', backgroundColor: '#f8f9f8' },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
  },
});
