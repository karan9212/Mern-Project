const User = require('../models/User');
const sendMobileOTP = require('../utils/sendMobileOTP');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Aadhaar data embedded directly
const aadhaarData = [
    { name: "Ravi Kumar", age: 32, address: "123 MG Road, Delhi", aadhaar: "123456789012", mobile: "9876543210" },
    { name: "Sunita Mehta", age: 28, address: "45 Gandhi Marg, Mumbai", aadhaar: "234567890123", mobile: "9123456780" },
    { name: "Anil Singh", age: 41, address: "78 Tagore Lane, Kolkata", aadhaar: "345678901234", mobile: "9988776655" },
    { name: "Meena Joshi", age: 35, address: "65 Nehru Street, Jaipur", aadhaar: "456789012345", mobile: "7982273061" },
    { name: "Vikram Chauhan", age: 38, address: "11 Sector 21, Chandigarh", aadhaar: "567890123456", mobile: "8765432109" },
    { name: "Priya Nair", age: 26, address: "9 Beach Road, Chennai", aadhaar: "678901234567", mobile: "9823456781" },
    { name: "Suresh Patil", age: 48, address: "24 Main Road, Pune", aadhaar: "789012345678", mobile: "9988123456" },
    { name: "Anita Deshmukh", age: 30, address: "32 Park Avenue, Nashik", aadhaar: "890123456789", mobile: "9012345678" },
    { name: "Amit Shah", age: 27, address: "102 Lotus Lane, Ahmedabad", aadhaar: "901234567890", mobile: "9667788990" },
    { name: "Radhika Menon", age: 34, address: "7 Lake View, Kochi", aadhaar: "012345678901", mobile: "9301234567" }
];

const otpStore = {}; // Temporary store for OTPs (in-memory)

// ----------------------------
// Send Mobile OTP
// ----------------------------
const sendMobileOtp = async (req, res) => {
    const { mobile } = req.body;

    try {
        const otp = generateOTP();
        otpStore[mobile] = otp;
        await sendMobileOTP(mobile, otp);
        res.json({ message: 'OTP sent to mobile number' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

// ----------------------------
// Verify Mobile OTP
// ----------------------------
const verifyMobileOtp = (req, res) => {
    const { mobile, otp } = req.body;
    if (otpStore[mobile] === otp) {
        delete otpStore[mobile];
        res.json({ message: 'Mobile verified' });
    } else {
        res.status(400).json({ message: 'Invalid OTP' });
    }
};

// ----------------------------
// Send Aadhaar OTP
// ----------------------------
const sendAadhaarOtp = async (req, res) => {
    const { aadhaar } = req.body;
    const user = aadhaarData.find(u => u.aadhaar === aadhaar);

    if (!user) return res.status(400).json({ message: 'Invalid Aadhaar number' });

    try {
        const otp = generateOTP();
        otpStore[aadhaar] = otp;
        await sendMobileOTP(user.mobile, otp);
        res.json({ message: 'OTP sent to Aadhaar linked mobile', mobile: user.mobile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send Aadhaar OTP' });
    }
};

// ----------------------------
// Verify Aadhaar OTP
// ----------------------------
const verifyAadhaarOtp = (req, res) => {
    const { aadhaar, otp } = req.body;
    if (otpStore[aadhaar] === otp) {
        delete otpStore[aadhaar];
        res.json({ message: 'Aadhaar verified' });
    } else {
        res.status(400).json({ message: 'Invalid OTP' });
    }
};

// ----------------------------
// Register User
// ----------------------------
const registerUser = async (req, res) => {
    const { name, mobile, aadhaar } = req.body;

    try {
        // Check if user already exists
        const existing = await User.findOne({ mobile });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const user = new User({ name, mobile, aadhaar, isVerified: true });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ----------------------------
// Login User
// ----------------------------
const loginUser = async (req, res) => {
    const { mobile } = req.body;

    try {
        // Check if user already exists
        const existing = await User.findOne({ mobile });
        if (!existing) return res.status(400).json({ message: 'User does not exists' });

        const user = new User({ mobile, isVerified: true });
        await user.save();

        res.status(201).json({ message: 'User Logged in successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    sendMobileOtp,
    verifyMobileOtp,
    sendAadhaarOtp,
    verifyAadhaarOtp,
    registerUser,
    loginUser
};
