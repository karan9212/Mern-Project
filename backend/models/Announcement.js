const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    audience: { type: String, enum: ['all', 'employee', 'user'], default: 'all' },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    publishDate: { type: Date, default: Date.now },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, strict: true }
);

module.exports = mongoose.model('Announcement', AnnouncementSchema, 'announcements');
