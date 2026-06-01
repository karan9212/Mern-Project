const Product = require('../models/Product');
const RentalOrder = require('../models/RentalOrder');
const Seller = require('../models/Seller');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const REQUEST_STATUSES = ['order_placed', 'seller_confirmed', 'getting_ready'];
const RUNNING_STATUSES = ['packed', 'out_for_delivery', 'delivered', 'return_in_transit'];
const COMPLETION_REQUEST_STATUSES = ['returned_to_seller'];
const COMPLETED_STATUSES = ['completed'];

const getSellerOrThrow = async (sellerId) => {
  const seller = await Seller.findOne({ sellerId: String(sellerId || '').trim() });
  if (!seller) {
    const error = new Error('Seller not found');
    error.statusCode = 404;
    throw error;
  }
  return seller;
};

const toStartOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const toEndOfDay = (date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const formatDateLabel = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const formatOrder = (order) => ({
  orderReference: order.orderReference,
  orderGroupReference: order.orderGroupReference || '',
  userId: order.userId,
  userName: order.userName,
  phoneNo: order.phoneNo,
  deliveryAddress: order.deliveryAddress,
  productid: order.productid,
  productName: order.productName,
  category: order.category,
  brand: order.brand,
  quantity: order.quantity,
  rentalDays: order.rentalDays,
  rentalStartDate: order.rentalStartDate,
  rentalEndDate: order.rentalEndDate,
  pricing: order.pricing,
  orderStatus: order.orderStatus,
  trackingStatus: order.trackingStatus,
  assignedDeliveryBoy: order.assignedDeliveryBoy || { deliveryBoyId: '', name: '', phoneNo: '' },
  estimatedDeliveryAt: order.estimatedDeliveryAt || null,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt
});

const buildDaySeries = (orders, month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const totalDays = end.getDate();
  const buckets = Array.from({ length: totalDays }, (_, index) => ({
    label: String(index + 1).padStart(2, '0'),
    count: 0,
    key: `${year}-${String(month).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`
  }));

  orders.forEach((order) => {
    const createdAt = new Date(order.createdAt);
    if (
      createdAt.getFullYear() === year &&
      createdAt.getMonth() + 1 === month
    ) {
      const dayIndex = createdAt.getDate() - 1;
      buckets[dayIndex].count += Number(order.quantity || 1);
    }
  });

  return {
    rangeLabel: `${MONTH_LABELS[month - 1]} ${year}`,
    series: buckets
  };
};

const buildMonthSeries = (orders, year) => {
  const buckets = MONTH_LABELS.map((label, index) => ({
    label,
    count: 0,
    key: `${year}-${String(index + 1).padStart(2, '0')}`
  }));

  orders.forEach((order) => {
    const createdAt = new Date(order.createdAt);
    if (createdAt.getFullYear() === year) {
      buckets[createdAt.getMonth()].count += Number(order.quantity || 1);
    }
  });

  return {
    rangeLabel: String(year),
    series: buckets
  };
};

const buildYearSeries = (orders) => {
  const yearMap = orders.reduce((acc, order) => {
    const year = new Date(order.createdAt).getFullYear();
    acc[year] = (acc[year] || 0) + Number(order.quantity || 1);
    return acc;
  }, {});

  const years = Object.keys(yearMap).sort();
  return {
    rangeLabel: years.length > 0 ? `${years[0]} - ${years[years.length - 1]}` : 'All Time',
    series: years.map((year) => ({
      label: year,
      key: year,
      count: yearMap[year]
    }))
  };
};

const buildSalesSeries = (orders, view, month, year) => {
  if (view === 'month') return buildMonthSeries(orders, year);
  if (view === 'year') return buildYearSeries(orders);
  return buildDaySeries(orders, month, year);
};

const getSellerPortalDashboard = async (req, res) => {
  const { sellerId } = req.params;
  const currentDate = new Date();
  const month = Math.min(12, Math.max(1, Number(req.query.month) || currentDate.getMonth() + 1));
  const year = Math.max(2020, Number(req.query.year) || currentDate.getFullYear());
  const view = ['day', 'month', 'year'].includes(req.query.view) ? req.query.view : 'day';

  try {
    const seller = await getSellerOrThrow(sellerId);
    const [orders, products] = await Promise.all([
      RentalOrder.find({ sellerId: seller.sellerId, paymentStatus: 'paid' }).sort({ createdAt: -1 }),
      Product.find({ productName: { $in: seller.sellerProducts || [] } }).sort({ productName: 1 })
    ]);

    const productsByName = new Map(products.map((product) => [product.productName, product]));
    const inventory = (seller.sellerProducts || []).map((productName) => {
      const product = productsByName.get(productName);
      return {
        productName,
        productid: product?.productid || '',
        category: product?.category || '',
        brand: product?.brand || '',
        status: product?.status || 'inactive',
        sellingPrice: Number(product?.sellingPrice || 0),
        productImage: Array.isArray(product?.productImages) ? product.productImages[0] || '' : ''
      };
    });

    const availableProducts = inventory.filter((item) => item.status === 'active');
    const outOfStockProducts = inventory.filter((item) => item.status !== 'active');
    const paidOrders = orders.filter((order) => order.paymentStatus === 'paid' && order.orderStatus !== 'cancelled');

    const orderRequests = orders.filter((order) => REQUEST_STATUSES.includes(order.trackingStatus));
    const runningOrders = orders.filter((order) => RUNNING_STATUSES.includes(order.trackingStatus));
    const completionRequests = orders.filter((order) => COMPLETION_REQUEST_STATUSES.includes(order.trackingStatus));
    const completedOrders = orders.filter((order) => COMPLETED_STATUSES.includes(order.trackingStatus));

    const availableYears = [...new Set(paidOrders.map((order) => new Date(order.createdAt).getFullYear()))]
      .sort((a, b) => a - b);

    const salesChart = buildSalesSeries(paidOrders, view, month, year);

    return res.status(200).json({
      seller: {
        sellerName: seller.sellerName,
        sellerId: seller.sellerId,
        companyEmail: seller.companyEmail,
        sellerContact: seller.sellerContact,
        sellerStatus: seller.sellerStatus,
        sellerAddress: seller.sellerAddress
      },
      stats: {
        totalProducts: inventory.length,
        availableProducts: availableProducts.length,
        outOfStockProducts: outOfStockProducts.length,
        openRequests: orderRequests.length,
        runningOrders: runningOrders.length,
        completionRequests: completionRequests.length,
        completedOrders: completedOrders.length
      },
      inventory,
      availableProducts,
      outOfStockProducts,
      salesChart: {
        view,
        month,
        year,
        availableYears,
        ...salesChart
      },
      orderRequests: orderRequests.map(formatOrder),
      runningOrders: runningOrders.map(formatOrder),
      completionRequests: completionRequests.map(formatOrder),
      completedOrders: completedOrders.map(formatOrder)
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const updateSellerOrderStatus = async (req, res) => {
  const { sellerId, orderReference } = req.params;
  const { action } = req.body;

  try {
    await getSellerOrThrow(sellerId);
    const order = await RentalOrder.findOne({ sellerId, orderReference });
    if (!order) {
      return res.status(404).json({ message: 'Order not found for this seller' });
    }

    const transitions = {
      accept_order: { trackingStatus: 'seller_confirmed', orderStatus: 'confirmed' },
      getting_ready: { trackingStatus: 'getting_ready', orderStatus: 'confirmed' },
      packed: { trackingStatus: 'packed', orderStatus: 'running' },
      mark_completed: { trackingStatus: 'completed', orderStatus: 'completed' }
    };

    if (!transitions[action]) {
      return res.status(400).json({ message: 'Invalid seller action' });
    }

    if (action === 'mark_completed' && !['returned_to_seller', 'completed'].includes(order.trackingStatus)) {
      return res.status(400).json({ message: 'This order is not ready for completion yet' });
    }

    Object.assign(order, transitions[action]);
    await order.save();

    return res.status(200).json({
      message: 'Seller order status updated successfully',
      order: formatOrder(order)
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  getSellerPortalDashboard,
  updateSellerOrderStatus
};
