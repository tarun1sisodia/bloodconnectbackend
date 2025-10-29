import express from 'express';
import * as userController from '../controllers/userController.js';
import EnhancedValidation from '../middleware/validationEnhanced.js';
import enhancedAuth from '../middleware/authEnhanced.js';

const { profileUpdateValidation } = EnhancedValidation;
const router = express.Router();

// Get current user profile
router.get('/profile', enhancedAuth.authenticate.bind(enhancedAuth), userController.getProfile);

// Update user profile
router.put('/profile', enhancedAuth.authenticate.bind(enhancedAuth), profileUpdateValidation, userController.updateProfile);

// Get all donors
router.get('/donors', userController.getDonors);

// Get user by ID
router.get('/:id', userController.getUserById);

//Get Current user profile 
// router.get('/profile', auth, userController.getProfile);
// Add this line to create an alias
router.get('/me', enhancedAuth.authenticate.bind(enhancedAuth), userController.getProfile);

export default router;
