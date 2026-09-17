const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const councilController = require('../controllers/councilRuleController.js');

// ตรวจสอบและสร้างโฟลเดอร์อัตโนมัติถ้ายังไม่มี
const uploadDir = path.join(__dirname, '../uploads/council-rules');
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
    cb(null, 'council-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ไม่เกิน 5MB
});

// Routes
router.get('/council-rules', councilController.getCouncilRules);
router.post('/council-rules', upload.array('images'), councilController.createCouncilRuleCategory);
router.put('/council-rules/:id', upload.array('images'), councilController.updateCouncilRuleCategory);
router.delete('/council-rules/:id', councilController.deleteCouncilRuleCategory);

module.exports = router;