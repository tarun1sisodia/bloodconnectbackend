const express = require('express');
const requestController = require('../controllers/requestController');
const { requestValidation } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create a new blood request
router.post('/', auth, requestValidation, requestController.createRequest);

// Get all blood requests (public)
router.get('/', requestController.getAllRequests);
// router.get('/', auth, requestController.getAllRequests);

// Get request by ID
router.get('/:id', requestController.getRequestById);

// Get requests by current user
router.get('/user/me', auth, requestController.getMyRequests);

// Update request
router.put('/:id', auth, requestController.updateRequest);

// Delete request
router.delete('/:id', auth, requestController.deleteRequest);

module.exports = router;
