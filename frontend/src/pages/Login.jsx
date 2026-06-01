import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
    loginId: '',
    mobile: '',
    mobileOtp: ''
  });
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

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
        loginId: '',
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
      loginId: '',
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
      await API.post('/sendMobileOtp', {
        mobile: formData.mobile,
        loginAs: formData.loginAs,
        loginId: formData.loginId
      });
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
    const loginId = formData.loginId.trim();
    const isPortalLogin = ['seller', 'delivery'].includes(formData.loginAs);
    if (!mobile) {
      showToast('Mobile number is required.');
      return;
    }

    if (isPortalLogin && !loginId) {
      showToast(formData.loginAs === 'seller' ? 'Seller ID is required.' : 'Delivery ID is required.');
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
        loginAs: formData.loginAs,
        loginId: formData.loginId
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
      const nextRoute =
        formData.loginAs === 'user'
          ? '/user-portal'
          : formData.loginAs === 'employee'
            ? '/dashboard'
            : formData.loginAs === 'seller'
              ? '/seller-portal'
              : '/delivery-portal';
      setTimeout(() => navigate(nextRoute), 300);
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed.', 'error');
    }
  };

  const handleRecoverPortalAccess = async () => {
    if (!recoveryEmail.trim()) {
      showToast('Please enter the registered company email.', 'warning');
      return;
    }

    try {
      const response = await API.post('/recoverPortalAccess', {
        loginAs: formData.loginAs,
        companyEmail: recoveryEmail.trim().toLowerCase()
      });

      setFormData((prev) => ({
        ...prev,
        loginId: response.data?.loginId || prev.loginId,
        mobile: response.data?.phoneNo || prev.mobile,
        mobileOtp: ''
      }));
      setMobileOtpSent(true);
      setMobileVerified(false);
      setForgotPasswordOpen(false);
      setRecoveryEmail('');
      showToast(
        `${response.data?.message || 'Recovery OTP sent.'}${response.data?.loginId ? ` Login ID: ${response.data.loginId}.` : ''} ${response.data?.maskedPhone ? `Phone: ${response.data.maskedPhone}.` : ''}`,
        'success'
      );
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to recover portal access.', 'error');
    }
  };

  const isPortalLogin = ['seller', 'delivery'].includes(formData.loginAs);
  const loginIdLabel = formData.loginAs === 'seller' ? 'Seller ID' : 'Delivery ID';

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
                    <FormControlLabel value="seller" control={<Radio />} label="Seller" />
                    <FormControlLabel value="delivery" control={<Radio />} label="Delivery" />
                  </RadioGroup>
                </FormControl>
                {isPortalLogin ? (
                  <TextField
                    name="loginId"
                    label={loginIdLabel}
                    onChange={handleChange}
                    value={formData.loginId}
                    required
                    disabled={mobileVerified}
                    fullWidth
                  />
                ) : null}
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

                {isPortalLogin ? (
                  <Button type="button" variant="text" onClick={() => setForgotPasswordOpen(true)} sx={{ alignSelf: 'flex-start', px: 0 }}>
                    Forgot Password / Recover Access
                  </Button>
                ) : null}

                {!isPortalLogin ? (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Don't have an account?{' '}
                    <Button type="button" variant="text" onClick={() => navigate('/register')} sx={{ p: 0, minWidth: 0 }}>
                      Go to Registration
                    </Button>
                  </Typography>
                ) : null}
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
      <Dialog open={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Recover Seller / Delivery Access</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the company email registered with the portal. We will verify it and send an OTP to the registered phone number.
            </Typography>
            <TextField
              label="Registered Company Email"
              type="email"
              value={recoveryEmail}
              onChange={(event) => setRecoveryEmail(event.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForgotPasswordOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRecoverPortalAccess}>
            Recover Access
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Login;
