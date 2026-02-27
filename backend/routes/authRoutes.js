const express = require('express');
const {
  registerUser,
  sendMobileOtp,
  verifyMobileOtp,
  sendAadhaarOtp,
  verifyAadhaarOtp,
  loginUser,
  getUserProfile,
  updateProfileImage
} = require('../controllers/authController');

const router = express.Router();

// Only use what is defined in authController.js
router.post('/loginUser', loginUser);
router.post('/registerUser', registerUser);
router.post('/sendMobileOtp', sendMobileOtp);
router.post('/verifyMobileOtp', verifyMobileOtp);
router.post('/sendAadhaarOtp', sendAadhaarOtp);
router.post('/verifyAadhaarOtp', verifyAadhaarOtp);
router.get('/user/:userId', getUserProfile);
router.post('/updateProfileImage', updateProfileImage);

module.exports = router;
