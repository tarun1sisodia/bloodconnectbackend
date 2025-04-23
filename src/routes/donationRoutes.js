const express = require('express');
const donationController = require('../controllers/donationController');
const { donationValidation } = require('../middleware/validation');
const { auth } = require('../middleware/auth');


const router = express.Router();

// Record a new donation
router.post('/', auth, donationValidation, donationController.createDonation);

// Get donations by current user
router.get('/me', auth, donationController.getUserDonations);

// Get donation by ID
router.get('/:id', auth, donationController.getDonationById);

// Verify a donation (admin only)
router.put('/:id/verify', auth, donationController.verifyDonation);

module.exports = router;
