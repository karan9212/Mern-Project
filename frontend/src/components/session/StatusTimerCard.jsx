import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

function StatusTimerCard({
  title,
  timeText,
  detailText,
  collapsed = false,
  remainingMs = 0,
  warningMs = 5 * 60 * 1000,
  dangerMs = 60 * 1000,
  defaultBorderColor = 'divider'
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderWidth: 2,
        borderColor: (theme) => {
          if (remainingMs <= dangerMs) return theme.palette.error.main;
          if (remainingMs <= warningMs) return theme.palette.warning.main;
          return theme.palette[defaultBorderColor]?.main || theme.palette.divider;
        }
      }}
    >
      <CardContent
        sx={{
          p: collapsed ? 1 : 2,
          '&:last-child': { pb: collapsed ? 1 : 2 }
        }}
      >
        {!collapsed && title ? (
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        ) : null}
        <Typography
          variant={collapsed ? 'body2' : 'h6'}
          fontWeight={700}
          sx={{
            textAlign: 'center',
            fontFamily: 'monospace',
            letterSpacing: collapsed ? 0.5 : 0,
            lineHeight: 1.2
          }}
        >
          {timeText}
        </Typography>
        {!collapsed && detailText ? (
          <Typography variant="caption" color="text.secondary">
            {detailText}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default StatusTimerCard;
