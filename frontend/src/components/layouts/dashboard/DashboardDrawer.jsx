import React from 'react';
import { Box, Drawer } from '@mui/material';

function DashboardDrawer({
  mobileOpen,
  onMobileClose,
  desktopCollapsed,
  drawerWidth,
  collapsedDrawerWidth,
  children
}) {
  return (
    <Box component="nav" sx={{ width: { md: desktopCollapsed ? collapsedDrawerWidth : drawerWidth }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
        }}
      >
        {children}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: desktopCollapsed ? collapsedDrawerWidth : drawerWidth,
            borderRight: '1px solid',
            borderColor: 'divider',
            overflowX: 'hidden',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.shorter
              })
          }
        }}
        open
      >
        {children}
      </Drawer>
    </Box>
  );
}

export default DashboardDrawer;
