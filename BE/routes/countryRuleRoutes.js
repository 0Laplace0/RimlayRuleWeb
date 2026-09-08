const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryRuleController');

router.get('/country-rules', countryController.getAllRules);
router.post('/country-rules/create', countryController.createFullRule);
router.put('/country-rules/update/:id', countryController.updateFullRule);
router.delete('/country-rules/delete/:id', countryController.deleteMainRule);

module.exports = router;