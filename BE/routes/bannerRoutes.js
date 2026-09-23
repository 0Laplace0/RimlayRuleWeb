const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bannerController = require('../controllers/bannerController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // เปลี่ยนจาก 'banner-' เป็น ${file.fieldname}- เพื่อแยกระหว่าง banner และ background
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ไม่เกิน 5MB ต่อไฟล์
});

// กำหนด fields ให้รองรับทั้ง 'banner' และ 'background'
const bannerUploadFields = upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'background', maxCount: 1 }
]);

router.get('/', bannerController.getBanners);
router.post('/', bannerUploadFields, bannerController.createBanner);
router.put('/:id', bannerUploadFields, bannerController.updateBanner);

module.exports = router;