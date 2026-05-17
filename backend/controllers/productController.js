const Product = require('../models/Product');

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .select(
        'productName hsnCode productid category subcategory brand description productImages tags status sellingPrice height width weight color'
      )
      .sort({ updatedAt: -1, _id: -1 });
    return res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const upsertProduct = async (req, res) => {
  const {
    productName,
    hsnCode,
    productid,
    category,
    subcategory,
    brand,
    description,
    productImages,
    tags,
    status,
    sellingPrice,
    height,
    width,
    weight,
    color
  } = req.body;

  const cleanProductId = String(productid || '').trim();
  const cleanStatus = String(status || 'active').trim().toLowerCase();

  if (!productName || !hsnCode || !cleanProductId) {
    return res.status(400).json({ message: 'productName, hsnCode and productid are required' });
  }

  if (!['active', 'inactive', 'discontinued'].includes(cleanStatus)) {
    return res.status(400).json({ message: 'status must be active, inactive or discontinued' });
  }

  const numericFields = {
    sellingPrice: Number(sellingPrice ?? 0),
    height: Number(height ?? 0),
    width: Number(width ?? 0),
    weight: Number(weight ?? 0)
  };

  if (Object.values(numericFields).some((num) => !Number.isFinite(num) || num < 0)) {
    return res.status(400).json({ message: 'sellingPrice, height, width and weight must be valid non-negative numbers' });
  }

  try {
    const payload = {
      productName: String(productName).trim(),
      hsnCode: String(hsnCode).trim(),
      productid: cleanProductId,
      category: String(category || '').trim(),
      subcategory: String(subcategory || '').trim(),
      brand: String(brand || '').trim(),
      description: String(description || '').trim(),
      productImages: normalizeStringArray(productImages),
      tags: normalizeStringArray(tags),
      status: cleanStatus,
      sellingPrice: numericFields.sellingPrice,
      height: numericFields.height,
      width: numericFields.width,
      weight: numericFields.weight,
      color: String(color || '').trim()
    };

    const existing = await Product.findOne({ productid: cleanProductId });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      return res.status(200).json({ message: 'Product updated successfully', product: existing });
    }

    const created = await Product.create(payload);
    return res.status(201).json({ message: 'Product created successfully', product: created });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product ID must be unique' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  upsertProduct
};
