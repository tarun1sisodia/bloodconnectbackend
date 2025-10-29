import express from 'express';
import * as contactController from '../controllers/contactController.js';
import enhancedAuth from '../middleware/authEnhanced.js';

const router = express.Router();

// Create a new contact message
router.post('/', enhancedAuth.authenticate.bind(enhancedAuth), contactController.createContact);

export default router;
