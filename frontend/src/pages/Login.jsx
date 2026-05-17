import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import API from '../api/api';
import AppToast from '../components/common/AppToast';
import useToast from '../hooks/useToast';
import { clearEmployeeActivity, refreshEmployeeActivity } from '../utils/employeeSession';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    loginAs: 'user',
    mobile: '',
    mobileOtp: ''
  });

  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const { toast, showToast, closeToast } = useToast('warning');
  const mobileRegex = /^\d{10}$/;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'loginAs') {
      setFormData((prev) => ({
        ...prev,
        loginAs: value,
        mobileOtp: ''
      }));
      setMobileOtpSent(false);
      setMobileVerified(false);
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleResetLogin = () => {
    setFormData({
      loginAs: 'user',
      mobile: '',
      mobileOtp: ''
    });
    setMobileOtpSent(false);
    setMobileVerified(false);
    showToast('Login form has been reset.', 'info');
  };

  // ------------------- Mobile OTP --------------------
  const sendMobileOtp = async () => {
    try {
      await API.post('/sendMobileOtp', { mobile: formData.mobile });
      setMobileOtpSent(true);
      showToast('OTP sent to mobile.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send mobile OTP.', 'error');
    }
  };

  const verifyMobileOtp = async () => {
    try {
      await API.post('/verifyMobileOtp', {
        mobile: formData.mobile,
        otp: formData.mobileOtp
      });
      setMobileVerified(true);
      showToast('Mobile verified.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid OTP for mobile.', 'error');
    }
  };

  // ------------------- Login --------------------
  const handleLogin = async (e) => {
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
      const res = await API.post('/loginUser', {
        mobile: formData.mobile,
        loginAs: formData.loginAs
      });

      // Save name and userId in localStorage
      const { name, userId, profileImage } = res.data.user;
      localStorage.setItem('name', name);
      localStorage.setItem('userId', userId);
      localStorage.setItem('profileImage', profileImage || '');
      localStorage.setItem('loginAs', formData.loginAs);
      if (formData.loginAs === 'user') {
        const expiryTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour from now
        localStorage.setItem('sessionExpiry', expiryTime);
        clearEmployeeActivity();
      } else {
        localStorage.removeItem('sessionExpiry');
        refreshEmployeeActivity();
      }

      showToast('Login successful.', 'success');
      setTimeout(() => navigate('/dashboard'), 300);
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed.', 'error');
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
                <FormControl>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Login as
                  </Typography>
                  <RadioGroup row name="loginAs" value={formData.loginAs} onChange={handleChange}>
                    <FormControlLabel value="user" control={<Radio />} label="User" />
                    <FormControlLabel value="employee" control={<Radio />} label="Employee" />
                  </RadioGroup>
                </FormControl>
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

                <Button type="button" variant="outlined" color="warning" onClick={handleResetLogin}>
                  Reset
                </Button>

                <Typography variant="body2" sx={{ mt: 1 }}>
                  Don't have an account?{' '}
                  <Button type="button" variant="text" onClick={() => navigate('/register')} sx={{ p: 0, minWidth: 0 }}>
                    Go to Registration
                  </Button>
                </Typography>
                <Typography variant="body2">
                  Need manager tools?{' '}
                  <Button type="button" variant="text" onClick={() => navigate('/manage-hub')} sx={{ p: 0, minWidth: 0 }}>
                    Open Manager Hub
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

export default Login;
