import express from 'express';
import * as donationController from '../controllers/donationController.js';
import EnhancedValidation from '../middleware/validationEnhanced.js';
import enhancedAuth from '../middleware/authEnhanced.js';

const { donationValidation } = EnhancedValidation;
const router = express.Router();

// Record a new donation
router.post('/', enhancedAuth.authenticate.bind(enhancedAuth), donationValidation, donationController.createDonation);

// Get donations by current user
router.get('/me', enhancedAuth.authenticate.bind(enhancedAuth), donationController.getUserDonations);

// Get donation by ID
router.get('/:id', enhancedAuth.authenticate.bind(enhancedAuth), donationController.getDonationById);

// Verify a donation (admin only)
router.put('/:id/verify', enhancedAuth.authenticate.bind(enhancedAuth), enhancedAuth.requireRole('admin'), donationController.verifyDonation);

export default router;
