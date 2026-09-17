const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog'); // ต้องมี Model MongoDB ที่สร้างไว้

// GET: ดึง Log ทั้งหมดจาก DB
router.get('/', async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 });
    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error: ' + error.message
    });
  }
});

// POST: บันทึก Log ลง DB
router.post('/', async (req, res) => {
  try {
    const { user, action, category, detail, ip, status } = req.body;
    
    const newLog = await ActivityLog.create({
      user: user || 'Admin',
      action,
      category,
      detail,
      ip: ip || req.ip || '127.0.0.1',
      status: status || 'SUCCESS',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    res.status(201).json({
      success: true,
      message: 'CRUD log recorded',
      data: newLog
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;