import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    if (!mobileVerified || !aadhaarVerified) {
      return alert('Please verify both mobile and Aadhaar first.');
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
    <div className="container">
      <h2>Register</h2>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <input
          name="name"
          placeholder="Name"
          onChange={handleChange}
          value={formData.name}
          required
        />

        {/* Mobile Number */}
        <input
          name="mobile"
          placeholder="Mobile Number"
          onChange={handleChange}
          value={formData.mobile}
          required
          disabled={mobileVerified}
        />

        {/* Send Mobile OTP */}
        {!mobileOtpSent && !mobileVerified && (
          <button type="button" onClick={sendMobileOtp}>
            Send OTP
          </button>
        )}

        {/* Mobile OTP input + verify */}
        {mobileOtpSent && !mobileVerified && (
          <>
            <input
              name="mobileOtp"
              placeholder="Enter Mobile OTP"
              onChange={handleChange}
              value={formData.mobileOtp}
              required
            />
            <button type="button" onClick={verifyMobileOtp}>
              Verify Mobile OTP
            </button>
            <button type="button" onClick={sendMobileOtp}>
              Resend OTP
            </button>
          </>
        )}

        {/* Aadhaar input + send OTP */}
        {mobileVerified && (
          <>
            <input
              name="aadhaar"
              placeholder="Aadhaar Number"
              onChange={handleChange}
              value={formData.aadhaar}
              required
              disabled={aadhaarVerified}
            />

            {!aadhaarOtpSent && !aadhaarVerified && (
              <button type="button" onClick={sendAadhaarOtp}>
                Send Aadhaar OTP
              </button>
            )}
          </>
        )}

        {/* Aadhaar OTP + verify */}
        {aadhaarOtpSent && !aadhaarVerified && (
          <>
            <input
              name="aadhaarOtp"
              placeholder="Enter Aadhaar OTP"
              onChange={handleChange}
              value={formData.aadhaarOtp}
              required
            />
            <button type="button" onClick={verifyAadhaarOtp}>
              Verify Aadhaar OTP
            </button>
            <button type="button" onClick={sendAadhaarOtp}>
              Resend OTP
            </button>
          </>
        )}

        {/* Navigate to Register */}
        <p style={{ marginTop: '20px' }}>
          Have an account?{' '}
          <button type="button" onClick={() => navigate('/')}>
            Go to Login
          </button>
        </p>

        {/* Final Submit */}
        {aadhaarVerified && (
          <button type="submit">Complete Registration</button>
        )}
      </form>
    </div>
  );
}

export default Register;
