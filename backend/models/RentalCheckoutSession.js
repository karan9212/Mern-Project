const mongoose = require('mongoose');

const checkoutItemSchema = new mongoose.Schema(
  {
    productid: { type: String, required: true, trim: true },
    productName: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },
    brand: { type: String, default: '', trim: true },
    productImage: { type: String, default: '' },
    sellerId: { type: String, default: '', trim: true },
    sellerName: { type: String, default: '', trim: true },
    sellerContact: { type: String, default: '', trim: true },
    sellerAddress: { type: String, default: '', trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    rentalDays: { type: Number, default: 1, min: 1 },
    pricing: {
      unitPrice: { type: Number, default: 0, min: 0 },
      subtotal: { type: Number, default: 0, min: 0 },
      deliveryFee: { type: Number, default: 0, min: 0 },
      gstAmount: { type: Number, default: 0, min: 0 },
      totalAmount: { type: Number, default: 0, min: 0 }
    }
  },
  { _id: false }
);

const RentalCheckoutSessionSchema = new mongoose.Schema(
  {
    sessionReference: { type: String, required: true, unique: true, trim: true },
    userId: { type: String, required: true, trim: true, index: true },
    userName: { type: String, default: '', trim: true },
    phoneNo: { type: String, default: '', trim: true },
    deliveryAddress: { type: String, default: '', trim: true },
    rentalStartDate: { type: Date, required: true },
    rentalEndDate: { type: Date, required: true },
    rentalDays: { type: Number, default: 1, min: 1 },
    items: { type: [checkoutItemSchema], default: [] },
    pricing: {
      subtotal: { type: Number, default: 0, min: 0 },
      deliveryFee: { type: Number, default: 0, min: 0 },
      gstAmount: { type: Number, default: 0, min: 0 },
      totalAmount: { type: Number, default: 0, min: 0 }
    },
    paymentGateway: { type: String, enum: ['razorpay'], default: 'razorpay' },
    paymentStatus: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true
    },
    razorpay: {
      orderId: { type: String, default: '', trim: true, index: true },
      paymentId: { type: String, default: '', trim: true },
      signature: { type: String, default: '', trim: true }
    }
  },
  { strict: true, timestamps: true }
);

module.exports = mongoose.model('RentalCheckoutSession', RentalCheckoutSessionSchema, 'rentalCheckoutSessions');
