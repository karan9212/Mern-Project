import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        mobile: '',
        mobileOtp: '',
    });

    const [mobileOtpSent, setMobileOtpSent] = useState(false);
    const [mobileVerified, setMobileVerified] = useState(false);

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

    const handleLogin = async (e) => {
        e.preventDefault();
        if (mobileVerified === false) {
            return alert('Please verify mobile first.');
        }

        try {
            await API.post('/login', {
                mobile: formData.mobile
            });

            alert('Login successful!');
            navigate('/Welcome');
        } catch (err) {
            alert(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="container">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
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

                {mobileVerified && (
                    <button type="submit">Login</button>
                )}
            </form>
        </div>
    );
}

export default Login;
