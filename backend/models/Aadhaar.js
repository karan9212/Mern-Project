const mongoose = require('mongoose');

const AadhaarSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 0, default: null },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    dateOfBirth: { type: Date, default: null },
    address: { type: String, default: '', trim: true },
    aadhaarNumber: { type: String, required: true, trim: true, unique: true },
    mobile: { type: String, required: true, trim: true, unique: true }
  },
  { strict: true, timestamps: true }
);

module.exports = mongoose.model('Aadhaar', AadhaarSchema, 'aadhaarData');
