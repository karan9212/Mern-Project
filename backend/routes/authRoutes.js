const express = require('express');
const { registerUser, loginUser, verifyOTP, welcomeUser } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.get('/welcome', protect, welcomeUser);

module.exports = router;
