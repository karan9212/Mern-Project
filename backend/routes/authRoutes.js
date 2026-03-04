const express = require('express');
const {
  registerUser,
  sendMobileOtp,
  verifyMobileOtp,
  sendAadhaarOtp,
  verifyAadhaarOtp,
  loginUser,
  getUserProfile,
  updateProfileImage,
  deleteUserAccount,
  logoutUser,
  getAllUsers,
  updateUser,
  getAadhaarData,
  upsertAadhaarData
} = require('../controllers/authController');
const {
  getAllTeams,
  createTeamMember,
  updateTeamMember
} = require('../controllers/teamController');

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
router.post('/logoutUser', logoutUser);
router.delete('/deleteUser/:userId', deleteUserAccount);
router.get('/users', getAllUsers);
router.put('/users/:userId', updateUser);
router.get('/aadhaar', getAadhaarData);
router.post('/aadhaar', upsertAadhaarData);
router.get('/teams', getAllTeams);
router.post('/teams', createTeamMember);
router.put('/teams/:employeeId', updateTeamMember);

// Backward-compatible aliases
router.get('/employees', getAllTeams);
router.post('/employees', createTeamMember);
router.put('/employees/:employeeId', updateTeamMember);

module.exports = router;
