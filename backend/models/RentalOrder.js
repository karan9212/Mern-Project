const mongoose = require('mongoose');

const RentalOrderSchema = new mongoose.Schema(
  {
    orderReference: { type: String, required: true, unique: true, trim: true },
    orderGroupReference: { type: String, default: '', trim: true, index: true },
    userId: { type: String, required: true, trim: true, index: true },
    userName: { type: String, default: '', trim: true },
    phoneNo: { type: String, default: '', trim: true },
    deliveryAddress: { type: String, default: '', trim: true },
    productid: { type: String, required: true, trim: true, index: true },
    productName: { type: String, required: true, trim: true },
    category: { type: String, default: '', trim: true },
    brand: { type: String, default: '', trim: true },
    productImage: { type: String, default: '' },
    sellerId: { type: String, required: true, trim: true, index: true },
    sellerName: { type: String, default: '', trim: true },
    sellerContact: { type: String, default: '', trim: true },
    sellerAddress: { type: String, default: '', trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    rentalDays: { type: Number, required: true, min: 1 },
    rentalStartDate: { type: Date, required: true },
    rentalEndDate: { type: Date, required: true },
    pricing: {
      unitPrice: { type: Number, default: 0, min: 0 },
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
    orderStatus: {
      type: String,
      enum: ['created', 'confirmed', 'completed', 'cancelled'],
      default: 'created',
      index: true
    },
    trackingStatus: {
      type: String,
      enum: ['order_placed', 'seller_confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'order_placed',
      index: true
    },
    assignedDeliveryBoy: {
      deliveryBoyId: { type: String, default: '', trim: true },
      name: { type: String, default: '', trim: true },
      phoneNo: { type: String, default: '', trim: true }
    },
    estimatedDeliveryAt: { type: Date, default: null },
    razorpay: {
      orderId: { type: String, default: '', trim: true, index: true },
      paymentId: { type: String, default: '', trim: true },
      signature: { type: String, default: '', trim: true }
    }
  },
  { strict: true, timestamps: true }
);

module.exports = mongoose.model('RentalOrder', RentalOrderSchema, 'rentalOrders');
