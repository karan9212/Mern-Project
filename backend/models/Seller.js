const mongoose = require('mongoose');
const { SELLER_STATUS_VALUES, normalizeSellerStatus } = require('../utils/sellerStatus');

const SellerSchema = new mongoose.Schema(
  {
    sellerName: { type: String, required: true, trim: true },
    sellerId: { type: String, required: true, trim: true, unique: true },
    sellerCategory: { type: [String], default: [] },
    sellerDescription: { type: String, default: '', trim: true },
    sellerStatus: {
      type: String,
      enum: SELLER_STATUS_VALUES,
      default: 'active',
      set: normalizeSellerStatus
    },
    sellerAddress: { type: String, default: '', trim: true },
    sellerContact: { type: String, default: '', trim: true },
    sellerGstIn: { type: String, default: '', trim: true },
    sellerProducts: { type: [String], default: [] },
    sellerLocationCordinates: {
      lat: { type: Number, default: 28.6139 },
      lng: { type: Number, default: 77.209 }
    }
  },
  { strict: true, timestamps: true }
);

module.exports = mongoose.model('Seller', SellerSchema, 'sellers');
