import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControlLabel,
  Stack,
  Switch,
  Typography
} from '@mui/material';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { useThemeMode } from '../../context/ThemeModeContext';

function Settings() {
  const navigate = useNavigate();
  const { mode, toggleColorMode } = useThemeMode();
  const name = localStorage.getItem('name');
  const sessionExpiry = Number(localStorage.getItem('sessionExpiry'));

  useEffect(() => {
    if (!name || !sessionExpiry || Date.now() > sessionExpiry) {
      localStorage.removeItem('name');
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionExpiry');
      localStorage.removeItem('profileImage');
      navigate('/');
    }
  }, [name, sessionExpiry, navigate]);

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
              Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Update your application preferences.
            </Typography>

            <Stack spacing={2}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {mode === 'dark' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
                      <Typography fontWeight={700}>Dark Mode</Typography>
                    </Stack>
                    <FormControlLabel
                      control={<Switch checked={mode === 'dark'} onChange={toggleColorMode} />}
                      label={mode === 'dark' ? 'On' : 'Off'}
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Button variant="outlined" onClick={() => navigate('/change-password')}>
                Change Password
              </Button>
              <Button variant="contained" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Settings;
