import React from 'react';
import { Chip } from '@mui/material';

function IdleCountdownChip({ remainingMs, timeText, labelPrefix = 'Idle logout in' }) {
  return (
    <Chip
      label={`${labelPrefix} ${timeText}`}
      color={remainingMs <= 60000 ? 'error' : remainingMs <= 300000 ? 'warning' : 'info'}
      variant="outlined"
    />
  );
}

export default IdleCountdownChip;
