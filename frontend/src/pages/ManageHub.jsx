import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from '@mui/material';
import API from '../api/api';
import AppToast from '../components/common/AppToast';
import PageLoader from '../components/common/PageLoader';
import useToast from '../hooks/useToast';

function ManageHub() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const verifyExistingSession = useCallback(async () => {
    const token = localStorage.getItem('managerHubToken');
    if (!token) {
      setChecking(false);
      return;
    }

    try {
      await API.get('/manager-hub/session', {
        headers: {
          'x-manager-hub-token': token
        }
      });
      setUnlocked(true);
    } catch (error) {
      localStorage.removeItem('managerHubToken');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    verifyExistingSession();
  }, [verifyExistingSession]);

  const handleUnlock = async (event) => {
    event.preventDefault();

    if (!password.trim()) {
      showToast('Manager Hub password is required.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const response = await API.post('/manager-hub/login', { password });
      localStorage.setItem('managerHubToken', response.data?.token || '');
      setPassword('');
      setUnlocked(true);
      showToast('Manager Hub unlocked.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to unlock Manager Hub.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLock = () => {
    localStorage.removeItem('managerHubToken');
    setUnlocked(false);
    showToast('Manager Hub locked.', 'info');
  };

  if (checking) {
    return <PageLoader message="Checking manager access..." minHeight="100vh" />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: 4,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(140deg, #0d1220 0%, #151d34 100%)'
            : 'linear-gradient(140deg, #f6f9fc 0%, #e3ecf8 100%)'
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={8} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Manager Hub
            </Typography>

            {unlocked ? (
              <Stack spacing={1.5}>
                <Button variant="contained" onClick={() => navigate('/aadhaar')}>
                  Open Aadhaar Manager
                </Button>
                <Button variant="contained" onClick={() => navigate('/products')}>
                  Open Product Manager
                </Button>
                <Button variant="contained" onClick={() => navigate('/sellers')}>
                  Open Seller Manager
                </Button>
                <Button variant="contained" onClick={() => navigate('/deliveries')}>
                  Open Delivery Manager
                </Button>
                <Button variant="outlined" color="warning" onClick={handleLock}>
                  Lock Manager Hub
                </Button>
                <Button variant="outlined" onClick={() => navigate('/login')}>
                  Back to Login
                </Button>
              </Stack>
            ) : (
              <Box component="form" onSubmit={handleUnlock}>
                <Stack spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    Enter the temporary manager password to access internal manager tools.
                  </Typography>
                  <TextField
                    label="Manager Password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoFocus
                    fullWidth
                  />
                  <Button type="submit" variant="contained" disabled={submitting}>
                    {submitting ? 'Checking...' : 'Unlock Manager Hub'}
                  </Button>
                  <Button type="button" variant="outlined" onClick={() => navigate('/login')}>
                    Back to Login
                  </Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
      <AppToast open={toast.open} message={toast.message} severity={toast.severity} onClose={closeToast} />
    </Box>
  );
}

export default ManageHub;
