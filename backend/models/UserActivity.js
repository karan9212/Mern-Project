const mongoose = require('mongoose');

// Booking Subschema
const bookingSchema = new mongoose.Schema({
  userName: String,
  mobile: String,
  address: String,
  sellerCompany: String,
  productPurchased: String,
  dateOfPurchase: String,       // dd-mm-yyyy hh:mm:ss
  dateOfDelivery: String,       // dd-mm-yyyy hh:mm:ss
  dateOfReturn: String,         // dd-mm-yyyy hh:mm:ss
  deliveryReturnDiff: String,   // dd-mm-yyyy hh:mm:ss (duration)
  minCost: Number,
  additionalCost: Number,
  deliveryCost: Number,
  gstCost: Number,
  totalCost: Number
}, { _id: false });

// Search Subschema
const searchSchema = new mongoose.Schema({
  productSearched: String,
  dateOfSearch: String          // dd-mm-yyyy
}, { _id: false });

// Main UserActivity Schema
const userActivitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  bookings: [bookingSchema],
  searches: [searchSchema]
});

module.exports = mongoose.model('UserActivity', userActivitySchema, 'userActivity');
