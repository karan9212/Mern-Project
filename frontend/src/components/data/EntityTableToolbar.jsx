import React from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import IdleCountdownChip from '../session/IdleCountdownChip';

function EntityTableToolbar({
  title,
  refreshLabel,
  onRefresh,
  isRefreshing,
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onBack,
  showIdleCountdown = false,
  idleRemainingMs = 0,
  idleTimeText = ''
}) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5} mb={2}>
      <Typography variant="h5" fontWeight={700}>{title}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
        {showIdleCountdown ? (
          <IdleCountdownChip remainingMs={idleRemainingMs} timeText={idleTimeText} />
        ) : null}
        <Button variant="outlined" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : refreshLabel}
        </Button>
        <TextField
          size="small"
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={onSearchChange}
          sx={{ width: { xs: '100%', sm: 260 } }}
        />
        <Button variant="outlined" onClick={onBack}>
          Back to Dashboard
        </Button>
      </Stack>
    </Stack>
  );
}

export default EntityTableToolbar;
