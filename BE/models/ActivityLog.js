const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user: { type: String, default: 'Admin' },
  action: { type: String, required: true },
  category: { type: String, required: true },
  detail: { type: String, default: '-' },
  ip: { type: String, default: '127.0.0.1' },
  status: { type: String, default: 'SUCCESS' },
  timestamp: { type: String }
}, { versionKey: false });

module.exports = mongoose.model('ActivityLog', activityLogSchema);