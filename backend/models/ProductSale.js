const mongoose = require('mongoose');

const ProductSaleSchema = new mongoose.Schema(
  {
    productid: { type: String, required: true, trim: true, index: true },
    productName: { type: String, required: true, trim: true },
    category: { type: String, default: '', trim: true },
    sellerId: { type: String, default: '', trim: true },
    sellerName: { type: String, default: '', trim: true },
    soldOn: { type: Date, required: true, index: true },
    dateKey: { type: String, required: true, trim: true, index: true },
    quantitySold: { type: Number, required: true, min: 0, default: 0 },
    revenue: { type: Number, required: true, min: 0, default: 0 }
  },
  { strict: true, timestamps: true }
);

module.exports = mongoose.model('ProductSale', ProductSaleSchema, 'productSales');
