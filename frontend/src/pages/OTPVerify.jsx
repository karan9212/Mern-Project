import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/api';

function OTPVerify() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otpData, setOtpData] = useState({ emailOTP: '', mobileOTP: '' });

  const handleChange = (e) => {
    setOtpData({ ...otpData, [e.target.name]: e.target.value });
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/verify-otp', { email: state.email, ...otpData });
      alert('OTP Verified! Now login.');
      navigate('/login');
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <div className="container">
      <h2>Verify OTP</h2>
      <form onSubmit={handleVerify}>
        <input name="emailOTP" placeholder="Email OTP" onChange={handleChange} required />
        <input name="mobileOTP" placeholder="Mobile OTP" onChange={handleChange} required />
        <button type="submit">Verify</button>
      </form>
    </div>
  );
}

export default OTPVerify;
