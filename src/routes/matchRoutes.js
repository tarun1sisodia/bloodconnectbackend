import express from 'express';
import * as matchController from '../controllers/matchController.js';
import enhancedAuth from '../middleware/authEnhanced.js';

const router = express.Router();

// Find matching donors for a request
router.post('/:requestId', enhancedAuth.authenticate.bind(enhancedAuth), matchController.findMatchingDonors);

// Volunteer as a donor for a request
router.post('/volunteer/:requestId', enhancedAuth.authenticate.bind(enhancedAuth), matchController.volunteerForRequest);

export default router;
