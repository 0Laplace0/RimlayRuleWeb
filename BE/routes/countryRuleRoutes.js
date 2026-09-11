const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryRuleController');

router.get('/country', countryController.getCountryRules);
router.get('/country-rules', countryController.getCountryRules);

router.post('/country', countryController.createCountryRule);
router.post('/country-rules/create', countryController.createCountryRule);

router.put('/country-rules/update/:id', countryController.updateCountryRule);
router.delete('/country-rules/delete/:id', countryController.deleteCountryRule);

module.exports = router;