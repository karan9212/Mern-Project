const { DeliveryBoy, DELIVERY_STATUS_VALUES } = require('../models/DeliveryBoy');

const getDeliveryBoys = async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.find({})
      .select('deliveryBoyName deliveryBoyId phoneNo companyEmail status address profileImage')
      .sort({ updatedAt: -1, _id: -1 });

    return res.status(200).json({ deliveryBoys });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const upsertDeliveryBoy = async (req, res) => {
  const { deliveryBoyName, deliveryBoyId, phoneNo, companyEmail, status, address, profileImage } = req.body;
  const cleanId = String(deliveryBoyId || '').trim();
  const cleanPhone = String(phoneNo || '').trim();
  const cleanEmail = String(companyEmail || '').trim().toLowerCase();
  const cleanStatus = String(status || 'active').trim().toLowerCase();

  if (!deliveryBoyName || !cleanId || !cleanPhone || !cleanEmail) {
    return res.status(400).json({ message: 'deliveryBoyName, deliveryBoyId, phoneNo and companyEmail are required' });
  }

  if (!/^\d{10}$/.test(cleanPhone)) {
    return res.status(400).json({ message: 'phoneNo must be a valid 10-digit number' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ message: 'companyEmail must be a valid email address' });
  }

  if (!DELIVERY_STATUS_VALUES.includes(cleanStatus)) {
    return res.status(400).json({ message: 'status must be active, inactive, on_hold or deleted' });
  }

  try {
    const duplicate = await DeliveryBoy.findOne({
      deliveryBoyId: { $ne: cleanId },
      $or: [{ phoneNo: cleanPhone }, { companyEmail: cleanEmail }]
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Another delivery boy already uses this phone number or company email' });
    }

    const payload = {
      deliveryBoyName: String(deliveryBoyName).trim(),
      deliveryBoyId: cleanId,
      phoneNo: cleanPhone,
      companyEmail: cleanEmail,
      status: cleanStatus,
      address: String(address || '').trim(),
      profileImage: profileImage || ''
    };

    const existing = await DeliveryBoy.findOne({ deliveryBoyId: cleanId });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      return res.status(200).json({ message: 'Delivery boy updated successfully', deliveryBoy: existing });
    }

    const created = await DeliveryBoy.create(payload);
    return res.status(201).json({ message: 'Delivery boy created successfully', deliveryBoy: created });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'deliveryBoyId must be unique' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDeliveryBoys,
  upsertDeliveryBoy
};
