import React from 'react';
import { AppBar, Avatar, Box, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';

function UserPortalHeader({ drawerWidth, collapsedDrawerWidth, desktopCollapsed, name, profileImage, onToggleMobile }) {
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${desktopCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
        ml: { md: `${desktopCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
        backdropFilter: 'blur(18px)',
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(15, 20, 36, 0.84)'
            : 'rgba(255, 255, 255, 0.88)',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ minHeight: 74 }}>
        <IconButton edge="start" color="inherit" onClick={onToggleMobile} sx={{ mr: 1.5, display: { md: 'none' } }}>
          <MenuRoundedIcon />
        </IconButton>
        <Stack spacing={0.25} sx={{ flexGrow: 1 }}>
          <img src="/assets/images/logo/yellow-white-logo.png" alt="Logo" style={{ width: 95 }} />
        </Stack>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Stack alignItems="flex-end" spacing={0}>
              <Typography fontWeight={700}>{name}</Typography>
              <Typography variant="caption" color="text.secondary">
                User Account
              </Typography>
            </Stack>
            <Avatar src={profileImage} sx={{ width: 42, height: 42 }}>
              {name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </Stack>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default UserPortalHeader;
