const RentalOrder = require('../models/RentalOrder');
const { DeliveryBoy } = require('../models/DeliveryBoy');

const getDeliveryBoyOrThrow = async (deliveryBoyId) => {
  const deliveryBoy = await DeliveryBoy.findOne({ deliveryBoyId: String(deliveryBoyId || '').trim() });
  if (!deliveryBoy) {
    const error = new Error('Delivery user not found');
    error.statusCode = 404;
    throw error;
  }
  return deliveryBoy;
};

const formatOrder = (order) => ({
  orderReference: order.orderReference,
  orderGroupReference: order.orderGroupReference || '',
  userName: order.userName,
  phoneNo: order.phoneNo,
  deliveryAddress: order.deliveryAddress,
  productName: order.productName,
  quantity: order.quantity,
  rentalStartDate: order.rentalStartDate,
  rentalEndDate: order.rentalEndDate,
  sellerId: order.sellerId,
  sellerName: order.sellerName,
  sellerContact: order.sellerContact,
  orderStatus: order.orderStatus,
  trackingStatus: order.trackingStatus,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt
});

const getDeliveryPortalDashboard = async (req, res) => {
  const { deliveryBoyId } = req.params;

  try {
    const deliveryBoy = await getDeliveryBoyOrThrow(deliveryBoyId);
    const orders = await RentalOrder.find({
      'assignedDeliveryBoy.deliveryBoyId': deliveryBoy.deliveryBoyId
    }).sort({ updatedAt: -1 });

    const assignedOrders = orders.filter((order) => ['packed', 'out_for_delivery'].includes(order.trackingStatus));
    const returnOrders = orders.filter((order) => ['delivered', 'return_in_transit'].includes(order.trackingStatus));
    const completedHandovers = orders.filter((order) => order.trackingStatus === 'returned_to_seller');

    return res.status(200).json({
      deliveryBoy: {
        deliveryBoyName: deliveryBoy.deliveryBoyName,
        deliveryBoyId: deliveryBoy.deliveryBoyId,
        phoneNo: deliveryBoy.phoneNo,
        companyEmail: deliveryBoy.companyEmail,
        status: deliveryBoy.status
      },
      stats: {
        assignedOrders: assignedOrders.length,
        returnOrders: returnOrders.length,
        completedHandovers: completedHandovers.length
      },
      assignedOrders: assignedOrders.map(formatOrder),
      returnOrders: returnOrders.map(formatOrder),
      completedHandovers: completedHandovers.map(formatOrder)
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const updateDeliveryOrderStatus = async (req, res) => {
  const { deliveryBoyId, orderReference } = req.params;
  const { action } = req.body;

  try {
    await getDeliveryBoyOrThrow(deliveryBoyId);
    const order = await RentalOrder.findOne({
      orderReference,
      'assignedDeliveryBoy.deliveryBoyId': deliveryBoyId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found for this delivery user' });
    }

    const transitions = {
      start_delivery: { trackingStatus: 'out_for_delivery', orderStatus: 'running' },
      delivered_to_customer: { trackingStatus: 'delivered', orderStatus: 'running' },
      pickup_return: { trackingStatus: 'return_in_transit', orderStatus: 'running' },
      returned_to_seller: { trackingStatus: 'returned_to_seller', orderStatus: 'running' }
    };

    if (!transitions[action]) {
      return res.status(400).json({ message: 'Invalid delivery action' });
    }

    Object.assign(order, transitions[action]);
    await order.save();

    return res.status(200).json({
      message: 'Delivery order status updated successfully',
      order: formatOrder(order)
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  getDeliveryPortalDashboard,
  updateDeliveryOrderStatus
};
