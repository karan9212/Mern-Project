import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';

function UserPortalSidebar({ navItems, activeSection, desktopCollapsed, onSectionChange }) {
  return (
    <Box sx={{ px: desktopCollapsed ? 1 : 1.5, py: 2.5 }}>
      <Stack spacing={1.1}>
        {!desktopCollapsed ? (
          <Box sx={{ px: 1, pb: 1 }}>
            <Typography variant="overline" color="text.secondary">
              User Navigation
            </Typography>
          </Box>
        ) : null}
        {navItems.map((item) => {
          const isActive = item.key === activeSection;
          return (
            <Button
              key={item.key}
              onClick={() => onSectionChange(item.key)}
              startIcon={desktopCollapsed ? null : item.icon}
              sx={{
                justifyContent: desktopCollapsed ? 'center' : 'flex-start',
                px: desktopCollapsed ? 0 : 1.5,
                py: 1.25,
                minWidth: 0,
                borderRadius: 2.5,
                color: isActive ? 'primary.contrastText' : 'text.primary',
                background: isActive
                  ? 'linear-gradient(135deg, #1f64ff 0%, #0ea5e9 100%)'
                  : 'transparent',
                '&:hover': {
                  background: isActive
                    ? 'linear-gradient(135deg, #1f64ff 0%, #0ea5e9 100%)'
                    : 'action.hover'
                }
              }}
            >
              {desktopCollapsed ? item.icon : item.label}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}

export default UserPortalSidebar;
