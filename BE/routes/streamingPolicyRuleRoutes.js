const express = require('express');
const router = express.Router();
const {
  getAllStreamingPolicies,
  createStreamingPolicy,
  updateStreamingPolicy,
  deleteStreamingPolicy
} = require('../controllers/streamingPolicyRuleController');

router.get('/streaming-policies', getAllStreamingPolicies);
router.post('/streaming-policies', createStreamingPolicy);
router.put('/streaming-policies/:id', updateStreamingPolicy);
router.delete('/streaming-policies/:id', deleteStreamingPolicy);

module.exports = router;