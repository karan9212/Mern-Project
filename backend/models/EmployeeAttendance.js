const mongoose = require('mongoose');

const EmployeeAttendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, trim: true, index: true },
    dateKey: { type: String, required: true, trim: true, index: true },
    punchIn: { type: Date, default: null },
    punchOut: { type: Date, default: null },
    workedMinutes: { type: Number, default: 0 },
    status: { type: String, enum: ['Present', 'Open'], default: 'Open' }
  },
  { timestamps: true, strict: true }
);

EmployeeAttendanceSchema.index({ employeeId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeAttendance', EmployeeAttendanceSchema, 'employeeAttendance');
