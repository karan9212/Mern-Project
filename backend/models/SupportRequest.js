const mongoose = require('mongoose');

const SupportRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true, index: true },
    subject: { type: String, required: true, trim: true },
    category: { type: String, enum: ['HR', 'IT', 'Payroll', 'Admin', 'Profile'], required: true },
    description: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' }
  },
  { timestamps: true, strict: true }
);

module.exports = mongoose.model('SupportRequest', SupportRequestSchema, 'supportRequests');
