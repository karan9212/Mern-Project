const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    hsnCode: { type: String, required: true, trim: true },
    productid: { type: String, required: true, trim: true, unique: true },
    category: { type: String, default: '', trim: true },
    subcategory: { type: String, default: '', trim: true },
    brand: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    productImages: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' },
    sellingPrice: { type: Number, default: 0, min: 0 },
    height: { type: Number, default: 0, min: 0 },
    width: { type: Number, default: 0, min: 0 },
    weight: { type: Number, default: 0, min: 0 },
    color: { type: String, default: '', trim: true }
  },
  { strict: true, timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema, 'products');
