const crypto = require('crypto');
const Product = require('../models/Product');
const RentalOrder = require('../models/RentalOrder');
const Seller = require('../models/Seller');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');

const DEFAULT_DELIVERY_FEE = 99;
const DEFAULT_GST_RATE = 0.18;
const DEFAULT_SERVICE_LOCATION = { lat: 28.6139, lng: 77.209 };

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDateKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const buildCountSeries = (items = [], keyName) => {
  const countMap = items.reduce((acc, item) => {
    const key = String(item?.[keyName] || '').trim();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(countMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
};

const calculateDistanceKm = (from, to) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadius * c).toFixed(1));
};

const getUserOrThrow = async (userId) => {
  const user = await User.findOne({ userId, status: { $ne: 'Deleted' } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const getOrCreateUserActivity = async (userId) => {
  let activity = await UserActivity.findOne({ userId });
  if (!activity) {
    activity = await UserActivity.create({ userId, bookings: [], searches: [] });
  }
  return activity;
};

const getBestSellerForProduct = async ({ product, sellerId }) => {
  if (sellerId) {
    const chosenSeller = await Seller.findOne({ sellerId, sellerStatus: 'active' });
    if (chosenSeller) return chosenSeller;
  }

  const matchingSellers = await Seller.find({
    sellerStatus: 'active',
    sellerProducts: product.productName
  }).sort({ updatedAt: -1 });

  if (matchingSellers.length > 0) return matchingSellers[0];

  const fallbackSeller = await Seller.findOne({ sellerStatus: 'active' }).sort({ updatedAt: -1 });
  if (!fallbackSeller) {
    const error = new Error('No active seller is available for this product right now');
    error.statusCode = 400;
    throw error;
  }

  return fallbackSeller;
};

const createRazorpayOrder = async ({ amount, receipt, notes = {} }) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const error = new Error('Razorpay keys are not configured on the server');
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt,
      notes
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload?.error?.description || 'Failed to create Razorpay order');
    error.statusCode = response.status || 500;
    throw error;
  }

  return payload;
};

const buildOrderBreakdown = (orders = []) => {
  const topOrderedProducts = orders.reduce((acc, order) => {
    const key = String(order.productName || '').trim();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + Number(order.quantity || 1);
    return acc;
  }, {});

  return Object.entries(topOrderedProducts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
};

const getUserDashboard = async (req, res) => {
  const { userId } = req.params;

  try {
    const [user, activity, orders] = await Promise.all([
      getUserOrThrow(userId),
      getOrCreateUserActivity(userId),
      RentalOrder.find({ userId, paymentStatus: 'paid' }).sort({ createdAt: -1 })
    ]);

    const orderCount = orders.length;
    const totalSpent = Number(
      orders.reduce((sum, order) => sum + Number(order.pricing?.totalAmount || 0), 0).toFixed(2)
    );
    const recentOrders = orders.slice(0, 5).map((order) => ({
      orderReference: order.orderReference,
      productName: order.productName,
      sellerName: order.sellerName,
      totalAmount: order.pricing?.totalAmount || 0,
      rentalStartDate: order.rentalStartDate,
      rentalEndDate: order.rentalEndDate,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt
    }));

    const topOrderedProducts = buildOrderBreakdown(orders);
    const topSearchedProducts = buildCountSeries(activity.searches || [], 'productSearched');

    res.status(200).json({
      profile: {
        name: user.name,
        userId: user.userId,
        phoneNo: user.phoneNo,
        address: user.address,
        profileImage: user.profileImage || ''
      },
      stats: {
        totalOrders: orderCount,
        totalSpent,
        activeRentals: orders.filter((order) => ['created', 'confirmed'].includes(order.orderStatus)).length,
        favoriteProduct: topOrderedProducts[0]?.label || 'No orders yet',
        mostSearchedProduct: topSearchedProducts[0]?.label || 'No searches yet'
      },
      topOrderedProducts,
      topSearchedProducts,
      recentOrders
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const getUserCatalog = async (req, res) => {
  const { userId } = req.params;
  const { q = '', category = '' } = req.query;

  try {
    await getUserOrThrow(userId);

    const query = { status: 'active' };
    if (category) {
      query.category = category;
    }

    if (q) {
      query.$or = [
        { productName: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { subcategory: { $regex: q, $options: 'i' } },
        { tags: { $elemMatch: { $regex: q, $options: 'i' } } }
      ];
    }

    const [products, sellers] = await Promise.all([
      Product.find(query).sort({ updatedAt: -1 }),
      Seller.find({ sellerStatus: 'active' }).select('sellerId sellerName sellerProducts sellerLocationCordinates')
    ]);

    const productsWithSellerCount = products.map((product) => {
      const activeSellerMatches = sellers.filter((seller) => seller.sellerProducts.includes(product.productName));
      return {
        ...product.toObject(),
        activeSellerCount: activeSellerMatches.length,
        nearestDistanceKm:
          activeSellerMatches.length > 0
            ? Math.min(
                ...activeSellerMatches.map((seller) =>
                  calculateDistanceKm(DEFAULT_SERVICE_LOCATION, seller.sellerLocationCordinates || DEFAULT_SERVICE_LOCATION)
                )
              )
            : null
      };
    });

    const categories = await Product.distinct('category', { status: 'active' });

    res.status(200).json({
      products: productsWithSellerCount,
      filters: {
        q: String(q || ''),
        category: String(category || ''),
        categories: categories.filter(Boolean).sort()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const logUserSearch = async (req, res) => {
  const { userId } = req.params;
  const { searchTerm } = req.body;
  const cleanTerm = String(searchTerm || '').trim();

  try {
    await getUserOrThrow(userId);
    if (!cleanTerm) {
      return res.status(400).json({ message: 'searchTerm is required' });
    }

    const activity = await getOrCreateUserActivity(userId);
    activity.searches.push({
      productSearched: cleanTerm,
      dateOfSearch: formatDateKey(new Date())
    });
    await activity.save();

    res.status(200).json({ message: 'Search logged successfully' });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const getNearbySellers = async (req, res) => {
  const { userId } = req.params;
  const { productid = '' } = req.query;

  try {
    await getUserOrThrow(userId);
    let targetProduct = null;
    if (productid) {
      targetProduct = await Product.findOne({ productid: String(productid).trim() }).select('productName category');
    }

    const sellerQuery = { sellerStatus: 'active' };
    if (targetProduct?.productName) {
      sellerQuery.sellerProducts = targetProduct.productName;
    }

    const sellers = await Seller.find(sellerQuery).sort({ updatedAt: -1 });

    res.status(200).json({
      mapCenter: DEFAULT_SERVICE_LOCATION,
      sellers: sellers.map((seller) => ({
        sellerId: seller.sellerId,
        sellerName: seller.sellerName,
        sellerDescription: seller.sellerDescription,
        sellerAddress: seller.sellerAddress,
        sellerContact: seller.sellerContact,
        sellerCategory: seller.sellerCategory || [],
        sellerProducts: seller.sellerProducts || [],
        sellerLocationCordinates: seller.sellerLocationCordinates || DEFAULT_SERVICE_LOCATION,
        sellerStatus: seller.sellerStatus
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const getUserOrders = async (req, res) => {
  const { userId } = req.params;

  try {
    await getUserOrThrow(userId);
    const orders = await RentalOrder.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({
      orders: orders.map((order) => ({
        orderReference: order.orderReference,
        productid: order.productid,
        productName: order.productName,
        category: order.category,
        sellerId: order.sellerId,
        sellerName: order.sellerName,
        quantity: order.quantity,
        rentalDays: order.rentalDays,
        rentalStartDate: order.rentalStartDate,
        rentalEndDate: order.rentalEndDate,
        pricing: order.pricing,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const createCheckoutOrder = async (req, res) => {
  const { userId } = req.params;
  const { productid, sellerId, quantity = 1, rentalStartDate, rentalEndDate, deliveryAddress = '' } = req.body;

  try {
    const user = await getUserOrThrow(userId);
    const product = await Product.findOne({ productid: String(productid || '').trim(), status: 'active' });
    if (!product) {
      return res.status(404).json({ message: 'Selected product is not available' });
    }

    const startDate = new Date(rentalStartDate);
    const endDate = new Date(rentalEndDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      return res.status(400).json({ message: 'Please provide a valid rental date range' });
    }

    const rentalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
    const normalizedQuantity = Math.max(1, Number(quantity) || 1);
    const seller = await getBestSellerForProduct({ product, sellerId: String(sellerId || '').trim() });

    const subtotal = Number((product.sellingPrice * normalizedQuantity * rentalDays).toFixed(2));
    const gstAmount = Number((subtotal * DEFAULT_GST_RATE).toFixed(2));
    const totalAmount = Number((subtotal + DEFAULT_DELIVERY_FEE + gstAmount).toFixed(2));
    const amountInPaise = Math.round(totalAmount * 100);
    const orderReference = `RNT-${userId}-${Date.now()}`;

    const razorpayOrder = await createRazorpayOrder({
      amount: amountInPaise,
      receipt: orderReference,
      notes: {
        userId,
        productid: product.productid,
        sellerId: seller.sellerId
      }
    });

    const rentalOrder = await RentalOrder.create({
      orderReference,
      userId,
      userName: user.name,
      phoneNo: user.phoneNo,
      deliveryAddress: String(deliveryAddress || user.address || '').trim(),
      productid: product.productid,
      productName: product.productName,
      category: product.category || '',
      brand: product.brand || '',
      productImage: Array.isArray(product.productImages) ? product.productImages[0] || '' : '',
      sellerId: seller.sellerId,
      sellerName: seller.sellerName,
      sellerContact: seller.sellerContact || '',
      sellerAddress: seller.sellerAddress || '',
      quantity: normalizedQuantity,
      rentalDays,
      rentalStartDate: startDate,
      rentalEndDate: endDate,
      pricing: {
        unitPrice: product.sellingPrice || 0,
        subtotal,
        deliveryFee: DEFAULT_DELIVERY_FEE,
        gstAmount,
        totalAmount
      },
      paymentGateway: 'razorpay',
      paymentStatus: 'created',
      orderStatus: 'created',
      razorpay: {
        orderId: razorpayOrder.id
      }
    });

    res.status(200).json({
      message: 'Checkout order created successfully',
      order: {
        orderReference: rentalOrder.orderReference,
        razorpayOrderId: razorpayOrder.id,
        amountInPaise,
        totalAmount,
        currency: razorpayOrder.currency || 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        prefill: {
          name: user.name,
          contact: user.phoneNo ? `+91${user.phoneNo}` : ''
        },
        notes: {
          userId,
          productName: product.productName
        },
        summary: {
          productName: product.productName,
          sellerName: seller.sellerName,
          rentalDays,
          deliveryAddress: rentalOrder.deliveryAddress,
          pricing: rentalOrder.pricing
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const verifyCheckoutPayment = async (req, res) => {
  const { userId } = req.params;
  const { orderReference, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    await getUserOrThrow(userId);
    const rentalOrder = await RentalOrder.findOne({ orderReference, userId });
    if (!rentalOrder) {
      return res.status(404).json({ message: 'Order not found for payment verification' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(503).json({ message: 'Razorpay secret is not configured on the server' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${rentalOrder.razorpay.orderId}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      rentalOrder.paymentStatus = 'failed';
      await rentalOrder.save();
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }

    rentalOrder.paymentStatus = 'paid';
    rentalOrder.orderStatus = 'confirmed';
    rentalOrder.razorpay.paymentId = String(razorpay_payment_id || '').trim();
    rentalOrder.razorpay.signature = String(razorpay_signature || '').trim();
    await rentalOrder.save();

    await User.findOneAndUpdate({ userId }, { $inc: { noOfBookings: 1 } });

    const activity = await getOrCreateUserActivity(userId);
    activity.bookings.push({
      userName: rentalOrder.userName,
      mobile: rentalOrder.phoneNo,
      address: rentalOrder.deliveryAddress,
      sellerCompany: rentalOrder.sellerName,
      productPurchased: rentalOrder.productName,
      dateOfPurchase: new Date().toISOString(),
      dateOfDelivery: formatDisplayDate(rentalOrder.rentalStartDate),
      dateOfReturn: formatDisplayDate(rentalOrder.rentalEndDate),
      deliveryReturnDiff: `${rentalOrder.rentalDays} day(s)`,
      minCost: rentalOrder.pricing.subtotal,
      additionalCost: 0,
      deliveryCost: rentalOrder.pricing.deliveryFee,
      gstCost: rentalOrder.pricing.gstAmount,
      totalCost: rentalOrder.pricing.totalAmount
    });
    await activity.save();

    res.status(200).json({
      message: 'Payment verified successfully',
      order: {
        orderReference: rentalOrder.orderReference,
        paymentStatus: rentalOrder.paymentStatus,
        orderStatus: rentalOrder.orderStatus
      }
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  getUserDashboard,
  getUserCatalog,
  logUserSearch,
  getNearbySellers,
  getUserOrders,
  createCheckoutOrder,
  verifyCheckoutPayment
};
