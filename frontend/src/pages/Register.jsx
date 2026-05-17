import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import API from '../api/api';
import AppToast from '../components/common/AppToast';
import useToast from '../hooks/useToast';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    mobileOtp: ''
  });
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const { toast, showToast, closeToast } = useToast('warning');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleResetRegistration = () => {
    setFormData({
      name: '',
      mobile: '',
      mobileOtp: ''
    });
    setMobileOtpSent(false);
    setMobileVerified(false);
    showToast('Registration form has been reset.', 'info');
  };

  const sendMobileOtp = async () => {
    const mobile = formData.mobile.trim();
    if (!/^\d{10}$/.test(mobile)) {
      showToast('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      await API.post('/sendMobileOtp', { mobile });
      setMobileOtpSent(true);
      showToast('OTP sent to mobile.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send OTP.', 'error');
    }
  };

  const verifyMobileOtp = async () => {
    if (!formData.mobileOtp.trim()) {
      showToast('Please enter OTP first.');
      return;
    }

    try {
      await API.post('/verifyMobileOtp', {
        mobile: formData.mobile.trim(),
        otp: formData.mobileOtp.trim()
      });
      setMobileVerified(true);
      showToast('Mobile verified successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid OTP.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    const mobile = formData.mobile.trim();

    if (!name || !mobile) {
      showToast('Please fill all required fields.');
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      showToast('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!mobileVerified) {
      showToast('Please verify mobile first.');
      return;
    }

    try {
      await API.post('/registerUser', { name, mobile });
      showToast('Registration successful.', 'success');
      setTimeout(() => navigate('/login'), 500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed.', 'error');
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Register using Aadhaar-linked mobile number.
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
                  <Button type="submit" variant="contained" size="large">
                    Complete Registration
                  </Button>
                )}

                <Button type="button" variant="outlined" color="warning" onClick={handleResetRegistration}>
                  Reset Registration
                </Button>

                <Typography variant="body2" sx={{ mt: 1 }}>
                  Have an account?{' '}
                  <Button type="button" variant="text" onClick={() => navigate('/')} sx={{ p: 0, minWidth: 0 }}>
                    Go to Login
                  </Button>
                </Typography>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Container>
      <AppToast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={closeToast}
      />
    </Box>
  );
}

export default Register;
