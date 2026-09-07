const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// ดึงข้อมูลทั้งหมด (Public)
router.get('/', ruleController.getAllRules);

// บันทึกและอัปเดตแบบ Full Structure (เฉพาะ Admin)
router.post('/full', verifyToken, checkRole(['admin']), ruleController.createFullRule);
router.put('/full/:id', verifyToken, checkRole(['admin']), ruleController.updateFullRule);

// จัดการ Main Rule แบบแยกย่อย (เฉพาะ Admin)
router.post('/main', verifyToken, checkRole(['admin']), ruleController.createMainRule);
router.delete('/main/:id', verifyToken, checkRole(['admin']), ruleController.deleteMainRule);

module.exports = router;