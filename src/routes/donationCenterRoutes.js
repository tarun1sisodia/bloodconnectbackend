const express = require('express');
const donationCenterController = require('../controllers/donationCenterController');
const { auth } = require('../middleware/auth');
const { appointmentValidation } = require('../middleware/validation');

const router = express.Router();

// Get all cities with donation centers (should come BEFORE the /:id route)
router.get('/cities', donationCenterController.getAllCities);

// Get all donation centers (public)
router.get('/', donationCenterController.getAllCenters);

// Get donation centers near user (requires auth)
router.get('/nearby', auth, donationCenterController.getNearbyDonationCenters);

// Get available slots for a specific donation center and date
router.get('/:id/slots', donationCenterController.getAvailableSlots);

// Get a single donation center by ID (public)
router.get('/:id', donationCenterController.getDonationCenterById);

// Book an appointment (requires auth)
router.post('/appointments', auth, appointmentValidation, donationCenterController.bookAppointment);

// Get user's appointments (requires auth)
router.get('/appointments/me', auth, donationCenterController.getUserAppointments);

// Cancel an appointment (requires auth)
router.put('/appointments/:id/cancel', auth, donationCenterController.cancelAppointment);

// Complete an appointment (admin only - would need admin middleware)
router.put('/appointments/:id/complete', auth, donationCenterController.completeAppointment);

module.exports = router;
