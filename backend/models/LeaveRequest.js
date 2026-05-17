const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true, index: true },
    employeeName: { type: String, required: true, trim: true },
    department: { type: String, default: '' },
    leaveType: {
      type: String,
      enum: ['Casual', 'Sick', 'Earned', 'Work From Home', 'Emergency'],
      required: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
  },
  { timestamps: true, strict: true }
);

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema, 'leaveRequests');
