import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

function EntityEditDialog({
  open,
  title,
  onClose,
  onSave,
  saving,
  saveLabel = 'Save Changes',
  maxWidth = 'md',
  children
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={onSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : saveLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EntityEditDialog;
