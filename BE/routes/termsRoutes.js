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

router.post('/terms', createTermRule);
router.post('/terms/create', createTermRule);

router.put('/terms/update/:id', updateTermRule);
router.delete('/terms/delete/:id', deleteTermRule);

module.exports = router;