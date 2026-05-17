const Team = require('../models/Team');
const EmployeeAttendance = require('../models/EmployeeAttendance');
const LeaveRequest = require('../models/LeaveRequest');
const Announcement = require('../models/Announcement');
const SupportRequest = require('../models/SupportRequest');
const ProductSale = require('../models/ProductSale');

const LEAVE_QUOTA = {
  Casual: 12,
  Sick: 8,
  Earned: 15,
  'Work From Home': 24,
  Emergency: 5
};

const getDateKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatHours = (minutes) => Number(((minutes || 0) / 60).toFixed(1));

const formatDateKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDayLabel = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SALES_VIEW_VALUES = ['day', 'month', 'year'];

const getSalesFilter = (query = {}) => {
  const now = new Date();
  const rawView = String(query.view || 'day').trim().toLowerCase();
  const rawMonth = Number(query.month);
  const rawYear = Number(query.year);
  const selectedView = SALES_VIEW_VALUES.includes(rawView) ? rawView : 'day';

  const selectedMonth = Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12
    ? rawMonth
    : now.getMonth() + 1;
  const selectedYear = Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100
    ? rawYear
    : now.getFullYear();

  return { selectedView, selectedMonth, selectedYear };
};

const getMonthLabel = (year, month) =>
  new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const getCurrentDateInfo = () => {
  const now = new Date();
  return {
    today: now,
    todayKey: formatDateKey(now),
    currentMonth: now.getMonth() + 1,
    currentYear: now.getFullYear()
  };
};

const getSalesBuckets = ({ view, month, year, availableYears }) => {
  if (view === 'month') {
    return {
      buckets: MONTH_LABELS.map((label, index) => ({
        bucketKey: `${year}-${String(index + 1).padStart(2, '0')}`,
        label
      })),
      match: {
        soldOn: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31, 23, 59, 59, 999)
        }
      },
      bucketExpression: { $dateToString: { format: '%Y-%m', date: '$soldOn' } },
      periodLabel: `${year}`,
      averageLabel: 'Avg / Month'
    };
  }

  if (view === 'year') {
    const years = availableYears.length > 0 ? [...availableYears].sort((a, b) => a - b) : [year];
    return {
      buckets: years.map((entryYear) => ({
        bucketKey: String(entryYear),
        label: String(entryYear)
      })),
      match: {},
      bucketExpression: { $dateToString: { format: '%Y', date: '$soldOn' } },
      periodLabel: 'All Years',
      averageLabel: 'Avg / Year'
    };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  return {
    buckets: Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month - 1, index + 1);
      return {
        bucketKey: formatDateKey(date),
        label: String(index + 1).padStart(2, '0')
      };
    }),
    match: {
      soldOn: {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0, 23, 59, 59, 999)
      }
    },
    bucketExpression: '$dateKey',
    periodLabel: getMonthLabel(year, month),
    averageLabel: 'Avg / Day'
  };
};

const normalizeProductList = (rows = []) =>
  rows
    .map((row) => ({
      productid: String(row._id?.productid || ''),
      productName: String(row._id?.productName || 'Unnamed Product'),
      category: String(row._id?.category || ''),
      totalQuantity: Number(row.totalQuantity || 0),
      totalRevenue: Number((row.totalRevenue || 0).toFixed(2)),
      soldOnBuckets: Array.isArray(row.soldOnBuckets) ? row.soldOnBuckets.length : 0
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity || a.productName.localeCompare(b.productName));

const buildLiveProductDetail = async () => {
  const { today, todayKey } = getCurrentDateInfo();
  const rows = await ProductSale.aggregate([
    {
      $match: {
        soldOn: {
          $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          $lte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
        }
      }
    },
    {
      $group: {
        _id: {
          productid: '$productid',
          productName: '$productName',
          category: '$category'
        },
        totalQuantity: { $sum: '$quantitySold' },
        totalRevenue: { $sum: '$revenue' },
        soldOnBuckets: { $addToSet: '$dateKey' }
      }
    }
  ]);

  const products = normalizeProductList(rows);
  return {
    mode: 'live',
    bucketKey: todayKey,
    label: `Live Today (${formatDayLabel(today)})`,
    totalUnits: products.reduce((sum, product) => sum + product.totalQuantity, 0),
    products
  };
};

const buildProductSalesAnalytics = async ({ view, month, year }) => {
  const yearRows = await ProductSale.aggregate([
    {
      $group: {
        _id: { $year: '$soldOn' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const availableYears = yearRows.map((row) => row._id).filter(Boolean);
  const { buckets, match, bucketExpression, periodLabel, averageLabel } = getSalesBuckets({
    view,
    month,
    year,
    availableYears
  });

  const [seriesRows, productRows, liveDetail] = await Promise.all([
    ProductSale.aggregate([
      ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
      {
        $group: {
          _id: bucketExpression,
          totalQuantity: { $sum: '$quantitySold' },
          totalRevenue: { $sum: '$revenue' },
          uniqueProducts: { $addToSet: '$productid' }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    ProductSale.aggregate([
      ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
      {
        $group: {
          _id: {
            bucketKey: bucketExpression,
            productid: '$productid',
            productName: '$productName',
            category: '$category'
          },
          totalQuantity: { $sum: '$quantitySold' },
          totalRevenue: { $sum: '$revenue' },
          soldOnBuckets: { $addToSet: '$dateKey' }
        }
      },
      { $sort: { '_id.bucketKey': 1, totalQuantity: -1, '_id.productName': 1 } }
    ]),
    buildLiveProductDetail()
  ]);

  const rowMap = new Map(
    seriesRows.map((row) => [
      String(row._id),
      {
        totalQuantity: Number(row.totalQuantity || 0),
        totalRevenue: Number((row.totalRevenue || 0).toFixed(2)),
        uniqueProducts: Array.isArray(row.uniqueProducts) ? row.uniqueProducts.length : 0
      }
    ])
  );

  const productsByBucket = productRows.reduce((acc, row) => {
    const bucketKey = String(row._id?.bucketKey || '');
    if (!bucketKey) return acc;
    if (!acc[bucketKey]) acc[bucketKey] = [];
    acc[bucketKey].push({
      productid: String(row._id?.productid || ''),
      productName: String(row._id?.productName || 'Unnamed Product'),
      category: String(row._id?.category || ''),
      totalQuantity: Number(row.totalQuantity || 0),
      totalRevenue: Number((row.totalRevenue || 0).toFixed(2)),
      soldOnBuckets: Array.isArray(row.soldOnBuckets) ? row.soldOnBuckets.length : 0
    });
    return acc;
  }, {});

  Object.keys(productsByBucket).forEach((bucketKey) => {
    productsByBucket[bucketKey] = normalizeProductList(productsByBucket[bucketKey].map((product) => ({
      _id: {
        productid: product.productid,
        productName: product.productName,
        category: product.category
      },
      totalQuantity: product.totalQuantity,
      totalRevenue: product.totalRevenue,
      soldOnBuckets: Array.from({ length: product.soldOnBuckets || 0 })
    })));
  });

  const series = buckets.map((bucket) => {
    const bucketData = rowMap.get(bucket.bucketKey) || { totalQuantity: 0, totalRevenue: 0, uniqueProducts: 0 };
    return {
      bucketKey: bucket.bucketKey,
      label: bucket.label,
      totalQuantity: bucketData.totalQuantity,
      totalRevenue: bucketData.totalRevenue,
      uniqueProducts: bucketData.uniqueProducts
    };
  });

  const totalUnits = series.reduce((sum, item) => sum + item.totalQuantity, 0);
  const totalRevenue = Number(series.reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2));
  const bestBucket = series.reduce(
    (best, item) => (item.totalQuantity > best.totalQuantity ? item : best),
    { bucketKey: '', label: '--', totalQuantity: 0, totalRevenue: 0, uniqueProducts: 0 }
  );

  return {
    view,
    series,
    productsByBucket,
    liveDetail,
    filters: {
      view,
      selectedMonth: month,
      selectedYear: year,
      availableYears: availableYears.length > 0 ? availableYears : [year]
    },
    summary: {
      periodLabel,
      totalUnits,
      totalRevenue,
      averageUnitsPerBucket: Number((totalUnits / Math.max(series.length, 1)).toFixed(1)),
      averageLabel,
      bestBucket,
      uniqueProductsSold: new Set(
        Object.values(productsByBucket).flat().map((product) => product.productid).filter(Boolean)
      ).size
    }
  };
};

const withAge = (doc) => {
  const plain = doc?.toObject ? doc.toObject() : doc;
  if (!plain?.dateOfBirth) return { ...plain, age: null };

  const dob = new Date(plain.dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasHadBirthday =
    now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasHadBirthday) age -= 1;
  return { ...plain, age };
};

const serializeAttendance = (record) => {
  if (!record) return null;
  const plain = record.toObject ? record.toObject() : record;
  return {
    _id: plain._id,
    employeeId: plain.employeeId,
    dateKey: plain.dateKey,
    punchIn: plain.punchIn,
    punchOut: plain.punchOut,
    workedMinutes: plain.workedMinutes || 0,
    workedHours: formatHours(plain.workedMinutes || 0),
    status: plain.status || 'Open'
  };
};

const getEmployeeOrThrow = async (employeeId) => {
  const employee = await Team.findOne({ employeeId });
  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }
  return employee;
};

const calculateLeaveBalance = async (employeeId) => {
  const approvedLeaves = await LeaveRequest.find({ employeeId, status: 'Approved' }).select('leaveType days');
  const consumed = approvedLeaves.reduce((acc, leave) => {
    acc[leave.leaveType] = (acc[leave.leaveType] || 0) + (leave.days || 0);
    return acc;
  }, {});

  return Object.entries(LEAVE_QUOTA).map(([type, total]) => ({
    type,
    total,
    used: consumed[type] || 0,
    remaining: Math.max(total - (consumed[type] || 0), 0)
  }));
};

const getEmployeeDashboard = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const employee = await getEmployeeOrThrow(employeeId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const todayKey = getDateKey(now);

    const [todayAttendance, monthlyAttendance, leaveBalance, pendingLeaves, announcements, openSupportCount, teamCount] =
      await Promise.all([
        EmployeeAttendance.findOne({ employeeId, dateKey: todayKey }),
        EmployeeAttendance.find({
          employeeId,
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }),
        calculateLeaveBalance(employeeId),
        LeaveRequest.countDocuments({ employeeId, status: 'Pending' }),
        Announcement.find({ active: true, audience: { $in: ['all', 'employee'] } })
          .sort({ priority: -1, publishDate: -1 })
          .limit(3),
        SupportRequest.countDocuments({ employeeId, status: { $in: ['Open', 'In Progress'] } }),
        Team.countDocuments({ status: { $ne: 'Deleted' }, employeeType: 'team' })
      ]);

    const totalWorkedMinutes = monthlyAttendance.reduce((sum, record) => sum + (record.workedMinutes || 0), 0);

    res.status(200).json({
      employee: withAge(employee),
      summary: {
        attendanceStatus: !todayAttendance
          ? 'Not Started'
          : todayAttendance.punchOut
            ? 'Checked Out'
            : 'Checked In',
        monthlyWorkedHours: formatHours(totalWorkedMinutes),
        presentDaysThisMonth: monthlyAttendance.filter((record) => Boolean(record.punchIn)).length,
        pendingLeaves,
        openSupportCount,
        teamCount,
        documentCount: Array.isArray(employee.documents) ? employee.documents.length : 0
      },
      todayAttendance: serializeAttendance(todayAttendance),
      leaveBalance,
      announcements
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const getEmployeeProductSales = async (req, res) => {
  const { employeeId } = req.params;
  const { selectedView, selectedMonth, selectedYear } = getSalesFilter(req.query);

  try {
    await getEmployeeOrThrow(employeeId);
    const salesAnalytics = await buildProductSalesAnalytics({
      view: selectedView,
      month: selectedMonth,
      year: selectedYear
    });

    res.status(200).json(salesAnalytics);
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const getEmployeeAttendance = async (req, res) => {
  const { employeeId } = req.params;

  try {
    await getEmployeeOrThrow(employeeId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const todayKey = getDateKey(now);

    const [todayAttendance, monthlyRecords, records] = await Promise.all([
      EmployeeAttendance.findOne({ employeeId, dateKey: todayKey }),
      EmployeeAttendance.find({ employeeId, createdAt: { $gte: monthStart, $lte: monthEnd } }),
      EmployeeAttendance.find({ employeeId }).sort({ dateKey: -1 }).limit(31)
    ]);

    const totalWorkedMinutes = monthlyRecords.reduce((sum, record) => sum + (record.workedMinutes || 0), 0);

    res.status(200).json({
      todayAttendance: serializeAttendance(todayAttendance),
      summary: {
        monthlyWorkedHours: formatHours(totalWorkedMinutes),
        presentDaysThisMonth: monthlyRecords.filter((record) => Boolean(record.punchIn)).length,
        checkedIn: Boolean(todayAttendance && !todayAttendance.punchOut)
      },
      records: records.map(serializeAttendance)
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const punchAttendance = async (req, res) => {
  const { employeeId } = req.params;

  try {
    await getEmployeeOrThrow(employeeId);
    const now = new Date();
    const todayKey = getDateKey(now);
    let attendance = await EmployeeAttendance.findOne({ employeeId, dateKey: todayKey });

    if (!attendance) {
      attendance = await EmployeeAttendance.create({
        employeeId,
        dateKey: todayKey,
        punchIn: now,
        status: 'Open'
      });
      return res.status(200).json({
        message: 'Punch in recorded successfully',
        attendance: serializeAttendance(attendance)
      });
    }

    if (!attendance.punchOut) {
      const workedMinutes = Math.max(1, Math.round((now.getTime() - new Date(attendance.punchIn).getTime()) / 60000));
      attendance.punchOut = now;
      attendance.workedMinutes = workedMinutes;
      attendance.status = 'Present';
      await attendance.save();

      return res.status(200).json({
        message: 'Punch out recorded successfully',
        attendance: serializeAttendance(attendance)
      });
    }

    return res.status(400).json({ message: 'Attendance already closed for today' });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const getEmployeeLeaves = async (req, res) => {
  const { employeeId } = req.params;

  try {
    await getEmployeeOrThrow(employeeId);
    const [leaveBalance, leaves] = await Promise.all([
      calculateLeaveBalance(employeeId),
      LeaveRequest.find({ employeeId }).sort({ createdAt: -1 })
    ]);

    res.status(200).json({ leaveBalance, leaves });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const createLeaveRequest = async (req, res) => {
  const { employeeId } = req.params;
  const { leaveType, startDate, endDate, reason } = req.body;

  try {
    const employee = await getEmployeeOrThrow(employeeId);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!leaveType || !reason || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Please provide valid leave details' });
    }

    if (end < start) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }

    const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

    const leave = await LeaveRequest.create({
      employeeId,
      employeeName: employee.name,
      department: employee.department || '',
      leaveType,
      startDate: start,
      endDate: end,
      days,
      reason: String(reason).trim(),
      status: 'Pending'
    });

    res.status(201).json({ message: 'Leave request submitted successfully', leave });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const { audience = 'employee' } = req.query;
    const announcements = await Announcement.find({
      active: true,
      audience: { $in: ['all', audience] }
    }).sort({ priority: -1, publishDate: -1 });

    res.status(200).json({ announcements });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSupportRequests = async (req, res) => {
  const { employeeId } = req.params;

  try {
    await getEmployeeOrThrow(employeeId);
    const requests = await SupportRequest.find({ employeeId }).sort({ createdAt: -1 });
    res.status(200).json({ requests });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const createSupportRequest = async (req, res) => {
  const { employeeId } = req.params;
  const { subject, category, description, priority } = req.body;

  try {
    await getEmployeeOrThrow(employeeId);

    if (!subject || !category || !description) {
      return res.status(400).json({ message: 'Subject, category and description are required' });
    }

    const request = await SupportRequest.create({
      employeeId,
      subject: String(subject).trim(),
      category,
      description: String(description).trim(),
      priority: priority || 'Medium',
      status: 'Open'
    });

    res.status(201).json({ message: 'Support request created successfully', request });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const updateEmployeeDocuments = async (req, res) => {
  const { employeeId } = req.params;
  const { documents } = req.body;

  try {
    await getEmployeeOrThrow(employeeId);

    if (!Array.isArray(documents)) {
      return res.status(400).json({ message: 'documents must be an array' });
    }

    const sanitizedDocuments = documents.map((document) => ({
      id: document.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: String(document.label || '').trim(),
      fileName: String(document.fileName || '').trim(),
      fileData: document.fileData || '',
      uploadedAt: document.uploadedAt || new Date()
    }));

    const employee = await Team.findOneAndUpdate(
      { employeeId },
      { $set: { documents: sanitizedDocuments } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Documents updated successfully',
      documents: employee.documents || []
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  getEmployeeDashboard,
  getEmployeeProductSales,
  getEmployeeAttendance,
  punchAttendance,
  getEmployeeLeaves,
  createLeaveRequest,
  getAnnouncements,
  getSupportRequests,
  createSupportRequest,
  updateEmployeeDocuments
};
