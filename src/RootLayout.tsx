import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import HelpdeskChatbot from '@/modules/core/chatbot/ui/HelpdeskChatbot';
import { Sidebar, SIDEBAR_WIDTH, Topbar } from '@/shared/components/layout';
import { BreadcrumbsNavigation, Notifier } from '@/shared/design-system';

export default function RootLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box display="flex" minHeight="100vh">
      <Topbar onMenuClick={() => setMobileOpen(true)} />

      <Box component="aside" sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, border: 0 } }}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, border: 0 } }}
        >
          <Sidebar />
        </Drawer>
      </Box>

      <Box component="main" flexGrow={1} minWidth={0} p={{ xs: 2, sm: 3, md: 4 }}>
        <Toolbar />
        <BreadcrumbsNavigation />
        <Outlet />
      </Box>

      <Notifier />
      <HelpdeskChatbot />
    </Box>
  );
}
