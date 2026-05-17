import React from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';

function PageLoader({ message = 'Loading...', minHeight = 240 }) {
  return (
    <Box
      sx={{
        minHeight,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <CircularProgress size={28} />
        <Typography color="text.secondary">{message}</Typography>
      </Stack>
    </Box>
  );
}

export default PageLoader;
