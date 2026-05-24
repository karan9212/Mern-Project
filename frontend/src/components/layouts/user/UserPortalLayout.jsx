import React from 'react';
import { Box, CssBaseline, Drawer } from '@mui/material';
import UserPortalHeader from './UserPortalHeader';

const drawerWidth = 300;
const collapsedDrawerWidth = 88;

function UserPortalLayout({
  desktopCollapsed,
  mobileOpen,
  onMobileClose,
  name,
  profileImage,
  onToggleMobile,
  sidebarContent,
  children
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0b1120 0%, #111a2f 100%)'
            : 'linear-gradient(135deg, #f7fbff 0%, #ebf4ff 100%)'
      }}
    >
      <CssBaseline />
      <UserPortalHeader
        drawerWidth={drawerWidth}
        collapsedDrawerWidth={collapsedDrawerWidth}
        desktopCollapsed={desktopCollapsed}
        name={name}
        profileImage={profileImage}
        onToggleMobile={onToggleMobile}
      />

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' }
        }}
      >
        {sidebarContent}
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          width: desktopCollapsed ? collapsedDrawerWidth : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: desktopCollapsed ? collapsedDrawerWidth : drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(15, 20, 36, 0.9)'
                : 'rgba(255, 255, 255, 0.9)',
            transition: 'width 180ms ease'
          }
        }}
      >
        {sidebarContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: 10 }}>
        {children}
      </Box>
    </Box>
  );
}

export default UserPortalLayout;
export { drawerWidth, collapsedDrawerWidth };
