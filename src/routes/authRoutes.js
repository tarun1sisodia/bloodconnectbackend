const express = require('express');
const authController = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimit');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register a new user
router.post('/register', authLimiter, registerValidation, authController.register);

// Login user
router.post('/login', authLimiter, loginValidation, authController.login);

// Forgot password
router.post('/forgot-password', authLimiter, authController.forgotPassword);

// Get current user
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;
