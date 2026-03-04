const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNo: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  dateOfBirth: { type: Date, default: null },
  userId: { type: String, unique: true },
  userCategory: { type: String, enum: ['NP', 'PR'], default: 'NP' },
  isVerified: { type: Boolean, default: false },
  address: { type: String, default: '' },
  dateOfJoining: { type: Date, default: Date.now },
  noOfBookings: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Not Active', 'Deleted'], default: 'Not Active' },
  dateOfDeletion: { type: Date, default: null },
  aadhaarNumber: { type: String, required: true },
  profileImage: { type: String, default: '' },
}, { strict: true });

UserSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const dob = new Date(this.dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasHadBirthday =
    now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasHadBirthday) age -= 1;
  return age;
});

module.exports = mongoose.model('User', UserSchema, 'users');
