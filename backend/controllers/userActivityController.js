const UserActivity = require('../models/UserActivity');

// POST: Log user activity (Booking or Search)
const logUserActivity = async (req, res) => {
  try {
    const { userId, booking, search } = req.body;

    let userActivity = await UserActivity.findOne({ userId });

    // Create if doesn't exist
    if (!userActivity) {
      userActivity = new UserActivity({ userId, bookings: [], searches: [] });
    }

    if (booking) {
      userActivity.bookings.push(booking);
    }

    if (search) {
      userActivity.searches.push(search);

      // Keep only latest 10 searches
      if (userActivity.searches.length > 10) {
        userActivity.searches = userActivity.searches.slice(-10);
      }
    }

    await userActivity.save();
    res.status(200).json({ message: 'Activity logged successfully', data: userActivity });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log activity' });
  }
};

// GET: Fetch all activity of a specific user
const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const userActivity = await UserActivity.findOne({ userId });

    if (!userActivity) {
      return res.status(404).json({ message: 'No activity found for this user' });
    }

    res.status(200).json(userActivity);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};

// GET: Fetch all user activities (for admin/testing)
const getAllActivities = async (req, res) => {
  try {
    const activities = await UserActivity.find();
    res.status(200).json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

module.exports = { logUserActivity, getUserActivity, getAllActivities };
