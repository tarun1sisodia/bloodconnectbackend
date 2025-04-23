const { validationResult, check } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  next();
};

// User registration validation
const registerValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  check('name', 'Name is required').not().isEmpty(),
  check('bloodType', 'Valid blood type is required').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  check('location.city', 'City is required').not().isEmpty(),
  check('location.state', 'State is required').not().isEmpty(),
  handleValidationErrors
];

// Login validation
const loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
  handleValidationErrors
];

// Blood request validation
const requestValidation = [
  check('patient.name', 'Patient name is required').not().isEmpty(),
  check('patient.age', 'Valid patient age is required').isInt({ min: 0, max: 120 }),
  check('patient.gender', 'Valid gender is required').isIn(['male', 'female', 'other']),
  check('patient.bloodType', 'Valid blood type is required').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  check('hospital.name', 'Hospital name is required').not().isEmpty(),
  check('hospital.address', 'Hospital address is required').not().isEmpty(),
  check('hospital.city', 'Hospital city is required').not().isEmpty(),
  check('hospital.state', 'Hospital state is required').not().isEmpty(),
  check('unitsNeeded', 'Units needed must be a positive number').isInt({ min: 1 }),
  check('urgency', 'Valid urgency level is required').optional().isIn(['low', 'medium', 'high', 'critical']),
  handleValidationErrors
];

// Donation validation
const donationValidation = [
  check('hospital.name', 'Hospital name is required').not().isEmpty(),
  check('hospital.city', 'Hospital city is required').not().isEmpty(),
  check('hospital.state', 'Hospital state is required').not().isEmpty(),
  check('bloodType', 'Valid blood type is required').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  check('units', 'Units must be a positive number').optional().isInt({ min: 1 }),
  check('donationDate', 'Valid donation date is required').optional().isISO8601(),
  handleValidationErrors
];

// Profile update validation
const profileUpdateValidation = [
  check('name', 'Name is required').optional().not().isEmpty(),
  check('phone', 'Valid phone number is required').optional().isMobilePhone(),
  check('bloodType', 'Valid blood type is required').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  check('location.city', 'City is required').optional().not().isEmpty(),
  check('location.state', 'State is required').optional().not().isEmpty(),
  check('isDonor', 'isDonor must be a boolean').optional().isBoolean(),
  handleValidationErrors
];

// Donation center validation
const donationCenterValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('address', 'Address is required').not().isEmpty(),
  check('city', 'City is required').not().isEmpty(),
  check('state', 'State is required').not().isEmpty(),
  check('phone', 'Valid phone number is required').isMobilePhone(),
  check('email', 'Valid email is required').optional().isEmail(),
  check('operatingHours', 'Operating hours must be an object').optional().isObject(),
  handleValidationErrors
];

// Appointment validation
const appointmentValidation = [
  check('donationCenter', 'Donation center ID is required').isMongoId(),
  check('date', 'Valid date is required').isISO8601(),
  check('timeSlot', 'Time slot is required').not().isEmpty(),
  handleValidationErrors
];


module.exports = {
  registerValidation,
  loginValidation,
  requestValidation,
  donationValidation,
  profileUpdateValidation,
  donationCenterValidation,
  appointmentValidation,
  handleValidationErrors
};
