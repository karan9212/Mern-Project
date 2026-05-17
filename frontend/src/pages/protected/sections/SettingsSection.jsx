import React from 'react';
import {
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography
} from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';

function SettingsSection({ mode, toggleColorMode, setLogoutDialogOpen, setDeleteDialogOpen, canDeleteAccount }) {
  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Appearance</Typography>
            <Card variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
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
            </Card>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Account Actions</Typography>
            <Stack spacing={1.5}>
              <Button
                color="error"
                variant="contained"
                startIcon={<LogoutRoundedIcon />}
                onClick={() => setLogoutDialogOpen(true)}
              >
                Logout
              </Button>
              {canDeleteAccount ? (
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteForeverRoundedIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Account
                </Button>
              ) : null}
            </Stack>
            {!canDeleteAccount && (
              <Typography variant="body2" color="text.secondary">
                Account deletion is disabled for employee logins. Employment records should be managed by authorised admins only.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default SettingsSection;
