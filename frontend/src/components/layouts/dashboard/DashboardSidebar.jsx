import React from 'react';
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import StatusTimerCard from '../../session/StatusTimerCard';

function DashboardSidebar({
  navItems,
  activeSection,
  desktopCollapsed,
  onSectionChange,
  hasSessionLimit,
  sessionTimeLeft,
  sessionMinutesLeft,
  sessionSecondsLeft,
  isEmployee,
  employeeIdleTimeLeft,
  employeeIdleMinutesLeft,
  employeeIdleRemainingMs
}) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: desktopCollapsed ? 2 : 3, pb: 2 }}>
        {desktopCollapsed ? (
          <img src="/assets/images/logo/logoYellow.png" alt="Logo" style={{ width: 36 }} />
        ) : (
          <img src="/assets/images/logo/yellow-white-logo.png" alt="Logo" style={{ width: 120 }} />
        )}
      </Box>
      <Divider />
      <List sx={{ px: 1.5, py: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.key}
            selected={activeSection === item.key}
            onClick={() => onSectionChange(item.key)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              justifyContent: desktopCollapsed ? 'center' : 'flex-start',
              px: desktopCollapsed ? 1 : 2
            }}
          >
            <ListItemIcon sx={{ minWidth: desktopCollapsed ? 0 : 38, mr: desktopCollapsed ? 0 : 1 }}>
              {item.icon}
            </ListItemIcon>
            {!desktopCollapsed && <ListItemText primary={item.label} />}
          </ListItemButton>
        ))}
      </List>
      {hasSessionLimit ? (
        <Box sx={{ mt: 'auto', p: desktopCollapsed ? 1.5 : 2 }}>
          <StatusTimerCard
            title="Session left"
            timeText={sessionTimeLeft}
            detailText={`${sessionMinutesLeft} min remaining`}
            collapsed={desktopCollapsed}
            remainingMs={sessionSecondsLeft * 1000}
          />
        </Box>
      ) : null}
      {isEmployee ? (
        <Box sx={{ mt: hasSessionLimit ? 0 : 'auto', p: desktopCollapsed ? 1.5 : 2 }}>
          <StatusTimerCard
            title="Idle logout in"
            timeText={employeeIdleTimeLeft}
            detailText={`Resets on save or navigation. ${employeeIdleMinutesLeft} min remaining`}
            collapsed={desktopCollapsed}
            remainingMs={employeeIdleRemainingMs}
            defaultBorderColor="info"
          />
        </Box>
      ) : null}
    </Box>
  );
}

export default DashboardSidebar;
