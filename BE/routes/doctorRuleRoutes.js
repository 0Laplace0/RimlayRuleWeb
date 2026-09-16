const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const doctorController = require('../controllers/doctorRuleController');

// ตรวจสอบและสร้างโฟลเดอร์อัตโนมัติถ้ายังไม่มี
const uploadDir = path.join(__dirname, '../uploads/doctor-rules');
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
    cb(null, 'doctor-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ไม่เกิน 5MB
});

// Routes
router.get('/doctor-rules', doctorController.getDoctorRules);
router.post('/doctor-rules', upload.array('images'), doctorController.createDoctorRuleCategory);
router.put('/doctor-rules/:id', upload.array('images'), doctorController.updateDoctorRuleCategory);
router.delete('/doctor-rules/:id', doctorController.deleteDoctorRuleCategory);

module.exports = router;