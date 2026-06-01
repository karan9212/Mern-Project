const mongoose = require('mongoose');

const DELIVERY_STATUS_VALUES = ['active', 'inactive', 'on_hold', 'deleted'];

const DeliveryBoySchema = new mongoose.Schema(
  {
    deliveryBoyName: { type: String, required: true, trim: true },
    deliveryBoyId: { type: String, required: true, trim: true, unique: true, index: true },
    phoneNo: { type: String, required: true, trim: true },
    companyEmail: { type: String, required: true, trim: true, lowercase: true },
    status: {
      type: String,
      enum: DELIVERY_STATUS_VALUES,
      default: 'active'
    },
    address: { type: String, default: '', trim: true },
    profileImage: { type: String, default: '' }
  },
  { strict: true, timestamps: true }
);

module.exports = {
  DeliveryBoy: mongoose.model('DeliveryBoy', DeliveryBoySchema, 'deliveryBoys'),
  DELIVERY_STATUS_VALUES
};
