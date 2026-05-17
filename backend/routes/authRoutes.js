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
const {
  getProducts,
  upsertProduct
} = require('../controllers/productController');
const {
  getSellers,
  upsertSeller
} = require('../controllers/sellerController');
const {
  getEmployeeDashboard,
  getEmployeeProductSales,
  getEmployeeAttendance,
  punchAttendance,
  getEmployeeLeaves,
  createLeaveRequest,
  getAnnouncements,
  getSupportRequests,
  createSupportRequest,
  updateEmployeeDocuments
} = require('../controllers/employeePortalController');

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
router.get('/products', getProducts);
router.post('/products', upsertProduct);
router.get('/sellers', getSellers);
router.post('/sellers', upsertSeller);
router.get('/teams', getAllTeams);
router.post('/teams', createTeamMember);
router.put('/teams/:employeeId', updateTeamMember);
router.get('/employee-portal/announcements', getAnnouncements);
router.get('/employee-portal/:employeeId/dashboard', getEmployeeDashboard);
router.get('/employee-portal/:employeeId/product-sales', getEmployeeProductSales);
router.get('/employee-portal/:employeeId/attendance', getEmployeeAttendance);
router.post('/employee-portal/:employeeId/attendance/punch', punchAttendance);
router.get('/employee-portal/:employeeId/leaves', getEmployeeLeaves);
router.post('/employee-portal/:employeeId/leaves', createLeaveRequest);
router.get('/employee-portal/:employeeId/support', getSupportRequests);
router.post('/employee-portal/:employeeId/support', createSupportRequest);
router.put('/employee-portal/:employeeId/documents', updateEmployeeDocuments);

// Backward-compatible aliases
router.get('/employees', getAllTeams);
router.post('/employees', createTeamMember);
router.put('/employees/:employeeId', updateTeamMember);

module.exports = router;
