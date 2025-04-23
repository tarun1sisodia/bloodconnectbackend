const express = require('express');
const contactController = require('../controllers/contactController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create a new contact message
router.post('/', auth, contactController.createContact);

module.exports = router;
