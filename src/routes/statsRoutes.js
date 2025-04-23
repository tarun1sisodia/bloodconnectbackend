const express = require('express');
const statsController = require('../controllers/statsController');

const router = express.Router();

// Get application statistics
router.get('/', statsController.getStats);

module.exports = router;
