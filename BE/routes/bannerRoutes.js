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
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ไม่เกิน 5MB
});

router.get('/', bannerController.getBanners);
router.post('/', upload.single('banner'), bannerController.createBanner);
router.put('/:id', upload.single('banner'), bannerController.updateBanner);

module.exports = router;