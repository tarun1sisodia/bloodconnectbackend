const { body, param, query, validationResult } = require("express-validator");
const mongoose = require("mongoose");

// Enhanced validation middleware with comprehensive security checks
class EnhancedValidation {
  // Handle validation errors with detailed feedback
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      }));

      return res.status(400).json({
        error: "Validation failed",
        message: "Please check your input data",
        details: formattedErrors,
      });
    }

    next();
  }

  // User registration validation with enhanced security
  static registerValidation = [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address")
      .isLength({ max: 254 })
      .withMessage("Email address is too long"),

    body("password")
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must be between 8 and 128 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),

    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Name can only contain letters and spaces"),

    body("bloodType")
      .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .withMessage("Invalid blood type"),

    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),

    body("location.city")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("City must be between 2 and 100 characters"),

    body("location.state")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("State must be between 2 and 100 characters"),

    this.handleValidationErrors,
  ];

  // Enhanced login validation
  static loginValidation = [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 1, max: 128 })
      .withMessage("Password length is invalid"),

    this.handleValidationErrors,
  ];

  // Blood request validation with comprehensive checks
  static requestValidation = [
    body("patient.name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Patient name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Patient name can only contain letters and spaces"),

    body("patient.age")
      .isInt({ min: 0, max: 120 })
      .withMessage("Patient age must be between 0 and 120"),

    body("patient.gender")
      .isIn(["male", "female", "other"])
      .withMessage("Invalid gender"),

    body("patient.bloodType")
      .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .withMessage("Invalid blood type"),

    body("hospital.name")
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("Hospital name must be between 2 and 200 characters"),

    body("hospital.address")
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage("Hospital address must be between 10 and 500 characters"),

    body("hospital.city")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Hospital city must be between 2 and 100 characters"),

    body("hospital.state")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Hospital state must be between 2 and 100 characters"),

    body("unitsNeeded")
      .isInt({ min: 1, max: 10 })
      .withMessage("Units needed must be between 1 and 10"),

    body("urgency")
      .optional()
      .isIn(["low", "medium", "high", "critical"])
      .withMessage("Invalid urgency level"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),

    this.handleValidationErrors,
  ];

  // Donation validation with enhanced security
  static donationValidation = [
    body("hospital.name")
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("Hospital name must be between 2 and 200 characters"),

    body("hospital.city")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Hospital city must be between 2 and 100 characters"),

    body("hospital.state")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Hospital state must be between 2 and 100 characters"),

    body("bloodType")
      .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .withMessage("Invalid blood type"),

    body("units")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Units must be between 1 and 5"),

    body("donationDate")
      .optional()
      .isISO8601()
      .withMessage("Donation date must be a valid date")
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        if (date > now) {
          throw new Error("Donation date cannot be in the future");
        }
        return true;
      }),

    this.handleValidationErrors,
  ];

  // Profile update validation
  static profileUpdateValidation = [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Name can only contain letters and spaces"),

    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),

    body("bloodType")
      .optional()
      .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .withMessage("Invalid blood type"),

    body("location.city")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("City must be between 2 and 100 characters"),

    body("location.state")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("State must be between 2 and 100 characters"),

    body("isDonor")
      .optional()
      .isBoolean()
      .withMessage("isDonor must be a boolean value"),

    body("dateOfBirth")
      .optional()
      .isISO8601()
      .withMessage("Date of birth must be a valid date")
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();
        if (age < 18 || age > 65) {
          throw new Error("Age must be between 18 and 65 for blood donation");
        }
        return true;
      }),

    this.handleValidationErrors,
  ];

  // Donation center validation
  static donationCenterValidation = [
    body("name")
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("Name must be between 2 and 200 characters"),

    body("address")
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage("Address must be between 10 and 500 characters"),

    body("city")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("City must be between 2 and 100 characters"),

    body("state")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("State must be between 2 and 100 characters"),

    body("phone")
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),

    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

    body("operatingHours")
      .optional()
      .isObject()
      .withMessage("Operating hours must be an object"),

    body("capacity")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Capacity must be between 1 and 1000"),

    this.handleValidationErrors,
  ];

  // Appointment validation
  static appointmentValidation = [
    body("donationCenter")
      .isMongoId()
      .withMessage("Invalid donation center ID"),

    body("date")
      .isISO8601()
      .withMessage("Date must be a valid date")
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        if (date < tomorrow) {
          throw new Error("Appointment must be at least 24 hours in advance");
        }
        return true;
      }),

    body("timeSlot")
      .notEmpty()
      .withMessage("Time slot is required")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Time slot must be in HH:MM format"),

    this.handleValidationErrors,
  ];

  // Contact form validation
  static contactValidation = [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Name can only contain letters and spaces"),

    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

    body("subject")
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Subject must be between 5 and 200 characters"),

    body("message")
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Message must be between 10 and 2000 characters"),

    this.handleValidationErrors,
  ];

  // MongoDB ObjectId validation
  static validateObjectId = (paramName) => [
    param(paramName).isMongoId().withMessage(`Invalid ${paramName} ID format`),
    this.handleValidationErrors,
  ];

  // Query parameter validation
  static validateQueryParams = [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),

    query("sort")
      .optional()
      .isIn(["createdAt", "updatedAt", "name", "date"])
      .withMessage("Invalid sort field"),

    query("order")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("Order must be asc or desc"),

    this.handleValidationErrors,
  ];

  // Password reset validation
  static passwordResetValidation = [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

    this.handleValidationErrors,
  ];

  // Password change validation
  static passwordChangeValidation = [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),

    body("newPassword")
      .isLength({ min: 8, max: 128 })
      .withMessage("New password must be between 8 and 128 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }),

    this.handleValidationErrors,
  ];

  // File upload validation
  static fileUploadValidation = [
    body("file").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("File is required");
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error(
          "File type not allowed. Only JPEG, PNG, and GIF are allowed"
        );
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        throw new Error("File size too large. Maximum size is 5MB");
      }

      return true;
    }),

    this.handleValidationErrors,
  ];
}

module.exports = EnhancedValidation;
