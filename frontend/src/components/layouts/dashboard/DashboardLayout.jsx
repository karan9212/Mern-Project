import React from 'react';
import { Box, CssBaseline, Stack } from '@mui/material';
import DashboardHeader from './DashboardHeader';
import DashboardDrawer from './DashboardDrawer';

function DashboardLayout({
  background,
  headerProps,
  drawerProps,
  sidebarContent,
  children
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background
      }}
    >
      <CssBaseline />
      <DashboardHeader {...headerProps} />
      <DashboardDrawer {...drawerProps}>
        {sidebarContent}
      </DashboardDrawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: 10 }}>
        <Stack spacing={2.5}>
          {children}
        </Stack>
      </Box>
    </Box>
  );
}

export default DashboardLayout;
