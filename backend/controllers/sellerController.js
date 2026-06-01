const Seller = require('../models/Seller');
const Product = require('../models/Product');
const { SELLER_STATUS_VALUES, normalizeSellerStatus } = require('../utils/sellerStatus');

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const getSellers = async (req, res) => {
  try {
    const sellers = await Seller.find({})
      .select(
        'sellerName sellerId companyEmail sellerCategory sellerDescription sellerStatus sellerAddress sellerContact sellerGstIn sellerProducts sellerLocationCordinates'
      )
      .sort({ updatedAt: -1, _id: -1 });

    const normalizedSellers = sellers.map((seller) => {
      const plainSeller = seller.toObject();
      return {
        ...plainSeller,
        sellerStatus: normalizeSellerStatus(plainSeller.sellerStatus),
        sellerLocationCordinates: {
          lat: Number(plainSeller.sellerLocationCordinates?.lat ?? 28.6139),
          lng: Number(plainSeller.sellerLocationCordinates?.lng ?? 77.209)
        }
      };
    });

    return res.status(200).json({ sellers: normalizedSellers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const upsertSeller = async (req, res) => {
  const {
    sellerName,
    sellerId,
    companyEmail,
    sellerCategory,
    sellerDescription,
    sellerStatus,
    sellerAddress,
    sellerContact,
    sellerGstIn,
    sellerProducts,
    sellerLocationCordinates
  } = req.body;

  const cleanSellerId = String(sellerId || '').trim();
  const cleanSellerStatus = normalizeSellerStatus(sellerStatus || 'active');
  const categories = normalizeStringArray(sellerCategory);
  const productNames = normalizeStringArray(sellerProducts);

  const cleanCompanyEmail = String(companyEmail || '').trim().toLowerCase();

  if (!sellerName || !cleanSellerId || !cleanCompanyEmail) {
    return res.status(400).json({ message: 'sellerName, sellerId and companyEmail are required' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanCompanyEmail)) {
    return res.status(400).json({ message: 'companyEmail must be a valid email address' });
  }

  if (!/^\d{10}$/.test(String(sellerContact || '').trim())) {
    return res.status(400).json({ message: 'sellerContact must be a valid 10-digit number' });
  }

  if (!SELLER_STATUS_VALUES.includes(cleanSellerStatus)) {
    return res.status(400).json({ message: 'sellerStatus must be active, inactive, on hold or deleted' });
  }

  try {
    const products = await Product.find({}, 'productName category');
    const validCategorySet = new Set(products.map((p) => p.category).filter(Boolean));
    const validProductNameSet = new Set(products.map((p) => p.productName).filter(Boolean));

    if (categories.some((cat) => !validCategorySet.has(cat))) {
      return res.status(400).json({ message: 'sellerCategory contains invalid categories' });
    }

    if (productNames.some((name) => !validProductNameSet.has(name))) {
      return res.status(400).json({ message: 'sellerProducts contains invalid product names' });
    }

    const lat = Number(sellerLocationCordinates?.lat ?? 28.6139);
    const lng = Number(sellerLocationCordinates?.lng ?? 77.209);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'sellerLocationCordinates.lat/lng must be valid numbers' });
    }
    if (lat < 28.3 || lat > 28.95 || lng < 76.8 || lng > 77.45) {
      return res.status(400).json({ message: 'sellerLocationCordinates must be within Delhi bounds' });
    }

    const payload = {
      sellerName: String(sellerName).trim(),
      sellerId: cleanSellerId,
      companyEmail: cleanCompanyEmail,
      sellerCategory: categories,
      sellerDescription: String(sellerDescription || '').trim(),
      sellerStatus: cleanSellerStatus,
      sellerAddress: String(sellerAddress || '').trim(),
      sellerContact: String(sellerContact || '').trim(),
      sellerGstIn: String(sellerGstIn || '').trim(),
      sellerProducts: productNames,
      sellerLocationCordinates: { lat, lng }
    };

    const duplicate = await Seller.findOne({
      sellerId: { $ne: cleanSellerId },
      $or: [{ sellerContact: String(sellerContact || '').trim() }, { companyEmail: cleanCompanyEmail }]
    });
    if (duplicate) {
      return res.status(400).json({ message: 'Another seller already uses this contact number or company email' });
    }

    const existing = await Seller.findOne({ sellerId: cleanSellerId });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      return res.status(200).json({ message: 'Seller updated successfully', seller: existing });
    }

    const created = await Seller.create(payload);
    return res.status(201).json({ message: 'Seller created successfully', seller: created });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'sellerId must be unique' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSellers,
  upsertSeller
};
