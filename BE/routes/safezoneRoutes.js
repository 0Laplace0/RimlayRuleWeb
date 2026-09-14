const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const safezoneController = require('../controllers/safezoneController');

// ตรวจสอบและสร้างโฟลเดอร์อัตโนมัติถ้ายังไม่มี
const uploadDir = path.join(__dirname, '../uploads/safezones');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ตั้งค่าที่เก็บไฟล์รูปภาพด้วย Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'safezone-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ไม่เกิน 5MB
});

// Routes
router.get('/safezones', safezoneController.getAllSafezones);
router.post('/safezones', upload.array('images'), safezoneController.createSafezone);
router.put('/safezones/:id', upload.array('images'), safezoneController.updateSafezone);
router.delete('/safezones/:id', safezoneController.deleteSafezone);

module.exports = router;