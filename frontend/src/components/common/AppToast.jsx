import React from 'react';
import { Alert, Snackbar } from '@mui/material';

function AppToast({
  open,
  message,
  severity = 'success',
  onClose,
  autoHideDuration = 3000,
  anchorOrigin = { vertical: 'top', horizontal: 'center' }
}) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export default AppToast;
