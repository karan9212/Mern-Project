import React from 'react';
import { AppBar, Box, Button, IconButton, Toolbar, Typography } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';

function DashboardHeader({
  activeLabel,
  desktopCollapsed,
  drawerWidth,
  collapsedDrawerWidth,
  loginAs,
  name,
  onToggleMobile,
  onToggleDesktop,
  onLogout
}) {
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${desktopCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
        ml: { md: `${desktopCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(20,27,45,0.88)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(6px)',
        transition: (theme) =>
          theme.transitions.create(['width', 'margin-left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shorter
          })
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onToggleMobile}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuRoundedIcon />
        </IconButton>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onToggleDesktop}
          sx={{ mr: 2, display: { xs: 'none', md: 'inline-flex' } }}
        >
          {desktopCollapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight={700}>{activeLabel}</Typography>
          <Typography variant="body2" color="text.secondary">
            Hello {loginAs === 'employee' ? 'Team' : 'User'}, {name}
          </Typography>
        </Box>
        <Button variant="outlined" color="error" onClick={onLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default DashboardHeader;
