const express = require('express');
const router = express.Router();
const { 
  getRefundPolicy, 
  createRefundRule,
  updateRefundRule,
  deleteRefundRule
} = require('../controllers/refundController');

router.get('/refund', getRefundPolicy);
router.get('/refund-policy', getRefundPolicy);

router.post('/refund', createRefundRule);
router.post('/refund/create', createRefundRule);

router.put('/refund/update/:id', updateRefundRule);
router.delete('/refund/delete/:id', deleteRefundRule);

module.exports = router;