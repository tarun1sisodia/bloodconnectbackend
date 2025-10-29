import express from 'express';
import * as requestController from '../controllers/requestController.js';
import EnhancedValidation from '../middleware/validationEnhanced.js';
import enhancedAuth from '../middleware/authEnhanced.js';

const { requestValidation } = EnhancedValidation;
const router = express.Router();

// Create a new blood request
router.post('/', enhancedAuth.authenticate.bind(enhancedAuth), requestValidation, requestController.createRequest);

// Get all blood requests (public)
router.get('/', requestController.getAllRequests);
// router.get('/', auth, requestController.getAllRequests);

// Get request by ID
router.get('/:id', requestController.getRequestById);

// Get requests by current user
// router.get('/me', auth, requestController.getRequestsByUser);


// Get requests by current user
router.get('/user/me', enhancedAuth.authenticate.bind(enhancedAuth), requestController.getMyRequests);

// Update request
router.put('/:id', enhancedAuth.authenticate.bind(enhancedAuth), requestController.updateRequest);

// Delete request
router.delete('/:id', enhancedAuth.authenticate.bind(enhancedAuth), requestController.deleteRequest);

export default router;
