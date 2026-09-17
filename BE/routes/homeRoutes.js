const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

router.get('/home', homeController.getAllRules);
router.post('/home', homeController.createFullRule);
router.put('/home/:id', homeController.updateFullRule);
router.delete('/home/:id', homeController.deleteMainRule);

module.exports = router;