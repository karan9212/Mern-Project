import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material';

function ConfirmDialog({
  open,
  title,
  description,
  children,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
  confirmVariant = 'contained',
  confirmDisabled = false,
  cancelDisabled = false
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {description ? <Typography>{description}</Typography> : null}
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={cancelDisabled}>
          {cancelLabel}
        </Button>
        <Button
          color={confirmColor}
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
