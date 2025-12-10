const express = require('express');
const router = express.Router();
const { logUserActivity, getUserActivity, getAllActivities } = require('../controllers/userActivityController');

// POST - log activity
router.post('/log', logUserActivity);

// GET - fetch activity by userId
router.get('/:userId', getUserActivity);

// GET - fetch all activities
router.get('/', getAllActivities);

module.exports = router;
