const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
//   password: { type: String, required: true },
//   emailOTP: { type: String },
//   mobileOTP: { type: String },
aadhaar: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
