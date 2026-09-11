const express = require('express');
const router = express.Router();
const { 
  getAllRules, 
  createFullRule, 
  updateFullRule, 
  deleteMainRule 
} = require('../controllers/activityRuleController');

router.get('/activity', getAllRules);
router.get('/activity-rules', getAllRules);

router.post('/activity', createFullRule);
router.post('/activity-rules/create', createFullRule);

router.put('/activity-rules/update/:id', updateFullRule);
router.delete('/activity-rules/delete/:id', deleteMainRule);

module.exports = router;