const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityRuleController');

router.get('/activity-rules', activityController.getAllRules);
router.post('/activity-rules/create', activityController.createFullRule);
router.put('/activity-rules/update/:id', activityController.updateFullRule);
router.delete('/activity-rules/delete/:id', activityController.deleteMainRule);

module.exports = router;