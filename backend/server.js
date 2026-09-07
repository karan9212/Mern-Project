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
  'http://127.0.0.1:3000',
  'https://mern-project-rose-two.vercel.app',
  'https://rentist.co.in',
  'https://www.rentist.co.in',
];

// Remove the complex function and use this for now:
app.use(cors({
  origin: true, // This automatically allows whatever origin is calling it
  credentials: true, // Adjust based on your needs
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

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