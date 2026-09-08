const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');

// เปลี่ยนมาใช้ Route ใหม่ตามต้องการ
router.get('/activity-rules', ruleController.getAllRules);
router.post('/activity-rules/create', ruleController.createFullRule);
router.put('/activity-rules/update/:id', ruleController.updateFullRule);
router.delete('/activity-rules/delete/:id', ruleController.deleteMainRule);

module.exports = router;