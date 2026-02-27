import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';

function ChangePassword() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');
  const sessionExpiry = Number(localStorage.getItem('sessionExpiry'));

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (!name || !sessionExpiry || Date.now() > sessionExpiry) {
      localStorage.removeItem('name');
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionExpiry');
      localStorage.removeItem('profileImage');
      navigate('/');
    }
  }, [name, sessionExpiry, navigate]);

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const closeToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handlePasswordChangeInput = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill all password fields.', 'warning');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match.', 'warning');
      return;
    }

    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showToast('Password updated successfully.', 'success');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, #0d1220 0%, #151d34 100%)'
            : 'linear-gradient(145deg, #eef3ff 0%, #f9fbff 100%)',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4 }} elevation={8}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Change Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Keep your account secure by using a strong password.
            </Typography>

            <Box component="form" onSubmit={handleChangePassword}>
              <Stack spacing={2}>
                <TextField
                  type="password"
                  label="Current Password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChangeInput}
                  fullWidth
                />
                <TextField
                  type="password"
                  label="New Password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChangeInput}
                  fullWidth
                />
                <TextField
                  type="password"
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChangeInput}
                  fullWidth
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button type="submit" variant="contained" fullWidth>
                    Update Password
                  </Button>
                  <Button type="button" variant="outlined" onClick={() => navigate('/dashboard')} fullWidth>
                    Back to Dashboard
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ChangePassword;
