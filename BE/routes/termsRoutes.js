const express = require('express');
const router = express.Router();
const { 
  getTermsAndConditions, 
  createTermRule,
  updateTermRule,
  deleteTermRule
} = require('../controllers/termsController');

router.get('/terms', getTermsAndConditions);
router.get('/terms-and-conditions', getTermsAndConditions);
router.post('/terms-and-conditions', createTermRule);
router.post('/terms-and-conditions/create', createTermRule);
router.put('/terms-and-conditions/update/:id', updateTermRule);
router.delete('/terms-and-conditions/delete/:id', deleteTermRule);

module.exports = router;