import React, { useState } from 'react';
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
import API from '../api/api';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    mobile: '',
    mobileOtp: '',
  });

  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'warning'
  });

  const mobileRegex = /^\d{10}$/;

  const showToast = (message, severity = 'warning') => {
    setToast({ open: true, message, severity });
  };

  const closeToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ------------------- Mobile OTP --------------------
  const sendMobileOtp = async () => {
    debugger;
    try {
      await API.post('/sendMobileOtp', { mobile: formData.mobile });
      setMobileOtpSent(true);
      alert('OTP sent to mobile!');
    } catch (err) {
      alert('Failed to send mobile OTP');
    }
  };

  const verifyMobileOtp = async () => {
    try {
      await API.post('/verifyMobileOtp', {
        mobile: formData.mobile,
        otp: formData.mobileOtp
      });
      setMobileVerified(true);
      alert('Mobile verified!');
    } catch (err) {
      alert('Invalid OTP for mobile');
    }
  };

  // ------------------- Login --------------------
  const handleLogin = async (e) => {
    debugger;
    e.preventDefault();

    const mobile = formData.mobile.trim();
    if (!mobile) {
      showToast('Mobile number is required.');
      return;
    }

    if (!mobileRegex.test(mobile)) {
      showToast('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!mobileVerified) {
      showToast('Please verify mobile first.');
      return;
    }

    try {
      const res = await API.post('/loginUser', { mobile: formData.mobile });

      const expiryTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour from now

      // Save name and userId in localStorage
      const { name, userId, profileImage } = res.data.user;
      localStorage.setItem('name', name);
      localStorage.setItem('userId', userId);
      localStorage.setItem('profileImage', profileImage || '');
      localStorage.setItem('sessionExpiry', expiryTime);

      alert('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(140deg, #0d1220 0%, #151d34 100%)'
            : 'linear-gradient(140deg, #f6f9fc 0%, #e3ecf8 100%)',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={8} sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Login
            </Typography>

            <Box component="form" onSubmit={handleLogin}>
              <Stack spacing={2.5}>
                <TextField
                  name="mobile"
                  label="Mobile Number"
                  onChange={handleChange}
                  value={formData.mobile}
                  required
                  disabled={mobileVerified}
                  fullWidth
                />

                {!mobileOtpSent && !mobileVerified && (
                  <Button type="button" variant="contained" onClick={sendMobileOtp}>
                    Send OTP
                  </Button>
                )}

                {mobileOtpSent && !mobileVerified && (
                  <>
                    <TextField
                      name="mobileOtp"
                      label="Enter Mobile OTP"
                      onChange={handleChange}
                      value={formData.mobileOtp}
                      required
                      fullWidth
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button type="button" variant="contained" onClick={verifyMobileOtp} fullWidth>
                        Verify Mobile OTP
                      </Button>
                      <Button type="button" variant="outlined" onClick={sendMobileOtp} fullWidth>
                        Resend OTP
                      </Button>
                    </Stack>
                  </>
                )}

                {mobileVerified && (
                  <Button type="submit" variant="contained" size="large">
                    Login
                  </Button>
                )}

                <Typography variant="body2" sx={{ mt: 1 }}>
                  Don't have an account?{' '}
                  <Button type="button" variant="text" onClick={() => navigate('/register')} sx={{ p: 0, minWidth: 0 }}>
                    Go to Registration
                  </Button>
                </Typography>
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

export default Login;
