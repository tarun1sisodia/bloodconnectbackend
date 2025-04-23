const express = require('express');
const matchController = require('../controllers/matchController');
const { auth } = require('../middleware/auth');


const router = express.Router();

// Find matching donors for a request
router.post('/:requestId', auth, matchController.findMatchingDonors);

// Volunteer as a donor for a request
router.post('/volunteer/:requestId', auth, matchController.volunteerForRequest);

module.exports = router;
