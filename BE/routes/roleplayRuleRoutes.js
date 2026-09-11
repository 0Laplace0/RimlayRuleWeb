const express = require('express');
const router = express.Router();
const { 
  getAllRules, 
  createFullRule,
  updateFullRule,
  deleteMainRule
} = require('../controllers/roleplayRuleController');

router.get('/', getAllRules);
router.get('/roleplay', getAllRules);
router.get('/roleplay-rules', getAllRules);

router.post('/', createFullRule);
router.post('/create', createFullRule);
router.post('/roleplay', createFullRule);
router.post('/roleplay/create', createFullRule);

router.put('/update/:id', updateFullRule);
router.put('/roleplay/update/:id', updateFullRule);

router.delete('/delete/:id', deleteMainRule);
router.delete('/roleplay/delete/:id', deleteMainRule);

module.exports = router;