import express from 'express';
import * as donationCenterController from '../controllers/donationCenterController.js';
import enhancedAuth from '../middleware/authEnhanced.js';
import EnhancedValidation from '../middleware/validationEnhanced.js';

const { appointmentValidation } = EnhancedValidation;
const router = express.Router();

// Get all cities with donation centers (should come BEFORE the /:id route)
router.get('/cities', donationCenterController.getAllCities);

// Get all donation centers (public)
router.get('/', donationCenterController.getAllCenters);

// Get donation centers near user (requires auth)
router.get('/nearby', enhancedAuth.authenticate.bind(enhancedAuth), donationCenterController.getNearbyDonationCenters);

// Get available slots for a specific donation center and date
router.get('/:id/slots', donationCenterController.getAvailableSlots);

// Get a single donation center by ID (public)
router.get('/:id', donationCenterController.getDonationCenterById);

// Book an appointment (requires auth)
router.post('/appointments', enhancedAuth.authenticate.bind(enhancedAuth), appointmentValidation, donationCenterController.bookAppointment);

// Get user's appointments (requires auth)
router.get('/appointments/me', enhancedAuth.authenticate.bind(enhancedAuth), donationCenterController.getUserAppointments);

// Cancel an appointment (requires auth)
router.put('/appointments/:id/cancel', enhancedAuth.authenticate.bind(enhancedAuth), donationCenterController.cancelAppointment);

// Complete an appointment (admin only - would need admin middleware)
router.put('/appointments/:id/complete', enhancedAuth.authenticate.bind(enhancedAuth).bind(enhancedAuth), enhancedAuth.requireRole('admin'), donationCenterController.completeAppointment);

export default router;
