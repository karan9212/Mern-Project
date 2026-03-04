const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phoneNo: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    dateOfBirth: { type: Date, default: null },
    employeeId: { type: String, required: true, unique: true, trim: true },
    employeeType: {
      type: [{ type: String, enum: ['team', 'subAdmin'] }],
      default: ['team']
    },
    department: { type: String, default: '' },
    position: { type: String, default: '' },
    address: { type: String, default: '' },
    education: { type: [mongoose.Schema.Types.Mixed], default: [] },
    experience: { type: String, default: '' },
    recruitedVia: { type: String, enum: ['referral', 'self', 'hiring campaign'], default: 'self' },
    referralBy: {
      name: { type: String, default: '' },
      employeeId: { type: String, default: '' }
    },
    dateOfJoining: {
      type: Date,
      default: null,
      validate: {
        validator: (value) => {
          if (!value) return true;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const joining = new Date(value);
          joining.setHours(0, 0, 0, 0);
          return joining >= today;
        },
        message: 'dateOfJoining cannot be in the past'
      }
    },
    status: { type: String, enum: ['Active', 'Not Active', 'Deleted'], default: 'Not Active' },
    dateOfExit: {
      type: Date,
      default: null,
      validate: {
        validator: (value) => {
          if (!value) return true;
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          return new Date(value) <= today;
        },
        message: 'dateOfExit cannot be in the future'
      }
    },
    aadhaarNumber: { type: String, required: true, trim: true },
    profileImage: { type: String, default: '' }
  },
  { strict: true }
);

TeamSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const dob = new Date(this.dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasHadBirthday =
    now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasHadBirthday) age -= 1;
  return age;
});

TeamSchema.pre('validate', function (next) {
  if (this.recruitedVia === 'referral') {
    if (!this.referralBy || !this.referralBy.name || !this.referralBy.employeeId) {
      return next(new Error('referralBy.name and referralBy.employeeId are required when recruitedVia is referral'));
    }
  }

  next();
});

module.exports = mongoose.model('Team', TeamSchema, 'teams');
