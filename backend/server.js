const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const activityRoutes = require('./routes/activityRoutes');

dotenv.config();
connectDB();

const app = express();

// FIXED CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://mern-project-rose-two.vercel.app',
  'https://rentist.co.in',
  'https://www.rentist.co.in',
  
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // Enable this if you send cookies or authorization headers
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Test routes
app.get('/', (req, res) => {
  res.send('Backend is running successfully');
});

app.get('/api/auth', (req, res) => {
  res.send('Auth API is working');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));