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

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    mobileOtp: '',
    aadhaar: '',
    aadhaarOtp: ''
  });

  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
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

  // ------------------- Aadhaar OTP --------------------
  const sendAadhaarOtp = async () => {
    try {
      const res = await API.post('/sendAadhaarOtp', { aadhaar: formData.aadhaar });
      setAadhaarOtpSent(true);
      alert('OTP sent to Aadhaar-linked mobile: ' + res.data.mobile);
    } catch (err) {
      alert('Invalid Aadhaar number');
    }
  };

  const verifyAadhaarOtp = async () => {
    try {
      await API.post('/verifyAadhaarOtp', {
        aadhaar: formData.aadhaar,
        otp: formData.aadhaarOtp
      });
      setAadhaarVerified(true);
      alert('Aadhaar verified!');
    } catch (err) {
      alert('Invalid OTP for Aadhaar');
    }
  };

  // ------------------- Final Submit --------------------
  const handleSubmit = async (e) => {
    debugger;
    e.preventDefault();

    const name = formData.name.trim();
    const mobile = formData.mobile.trim();
    const aadhaar = formData.aadhaar.trim();

    if (!name || !mobile || !aadhaar) {
      showToast('Please fill all required fields.');
      return;
    }

    if (!mobileRegex.test(mobile)) {
      showToast('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!mobileVerified || !aadhaarVerified) {
      showToast('Please verify both mobile and Aadhaar first.');
      return;
    }

    try {
      await API.post('/registerUser', {
        name: formData.name,
        mobile: formData.mobile,
        aadhaar: formData.aadhaar
      });

      alert('Registration successful!');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
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
              Register
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  name="name"
                  label="Name"
                  onChange={handleChange}
                  value={formData.name}
                  required
                  fullWidth
                />

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
                  <>
                    <TextField
                      name="aadhaar"
                      label="Aadhaar Number"
                      onChange={handleChange}
                      value={formData.aadhaar}
                      required
                      disabled={aadhaarVerified}
                      fullWidth
                    />

                    {!aadhaarOtpSent && !aadhaarVerified && (
                      <Button type="button" variant="contained" onClick={sendAadhaarOtp}>
                        Send Aadhaar OTP
                      </Button>
                    )}
                  </>
                )}

                {aadhaarOtpSent && !aadhaarVerified && (
                  <>
                    <TextField
                      name="aadhaarOtp"
                      label="Enter Aadhaar OTP"
                      onChange={handleChange}
                      value={formData.aadhaarOtp}
                      required
                      fullWidth
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button type="button" variant="contained" onClick={verifyAadhaarOtp} fullWidth>
                        Verify Aadhaar OTP
                      </Button>
                      <Button type="button" variant="outlined" onClick={sendAadhaarOtp} fullWidth>
                        Resend OTP
                      </Button>
                    </Stack>
                  </>
                )}

                <Typography variant="body2" sx={{ mt: 1 }}>
                  Have an account?{' '}
                  <Button type="button" variant="text" onClick={() => navigate('/')} sx={{ p: 0, minWidth: 0 }}>
                    Go to Login
                  </Button>
                </Typography>

                {aadhaarVerified && (
                  <Button type="submit" variant="contained" size="large">
                    Complete Registration
                  </Button>
                )}
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

export default Register;
