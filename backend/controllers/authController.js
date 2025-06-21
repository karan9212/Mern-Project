const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmailOTP = require('../utils/sendEmailOTP');
const sendMobileOTP = require('../utils/sendMobileOTP');

// Generate random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ----------------------------
// Register User
// ----------------------------
const registerUser = async (req, res) => {
  const { name, email, mobile, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTPs
    const emailOTP = generateOTP();
    const mobileOTP = generateOTP();

    // Create new user
    user = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      emailOTP,
      mobileOTP
    });

    await user.save();

    // Send OTPs
    await sendEmailOTP(email, emailOTP);
    await sendMobileOTP(mobile, mobileOTP);

    res.status(201).json({ message: 'User registered. OTPs sent to Email and Mobile.' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// ----------------------------
// Verify OTP
// ----------------------------
const verifyOTP = async (req, res) => {
  const { email, emailOTP, mobileOTP } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'User not found' });

    if (user.emailOTP === emailOTP && user.mobileOTP === mobileOTP) {
      user.isVerified = true;
      user.emailOTP = null; // Clear OTPs after verification
      user.mobileOTP = null;
      await user.save();
      res.json({ message: 'OTP verified successfully. You can now login.' });
    } else {
      res.status(400).json({ message: 'Invalid OTPs' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// ----------------------------
// Login User
// ----------------------------
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    if (!user.isVerified) return res.status(400).json({ message: 'Please verify your account first' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const payload = { id: user._id, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, name: user.name });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// ----------------------------
// Welcome User (Protected Route)
// ----------------------------
const welcomeUser = (req, res) => {
  res.json({ message: `Welcome ${req.user.name}!` });
};

module.exports = {
  registerUser,
  loginUser,
  verifyOTP,
  welcomeUser
};
