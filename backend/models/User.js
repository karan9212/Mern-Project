const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  aadhaar: { type: String, required: true },
  userId: { type: String, unique: true },
  userType: { type: String, enum: ['NP', 'PR'], default: 'NP' },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema, 'users');
