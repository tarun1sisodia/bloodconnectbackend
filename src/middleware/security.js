const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");

// Enhanced security middleware
class SecurityMiddleware {
  // Advanced rate limiting with different tiers
  static createRateLimiters() {
    return {
      // Strict rate limiting for auth endpoints
      authLimiter: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per 15 minutes
        message: {
          error: "Too many authentication attempts",
          retryAfter: "15 minutes",
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
        keyGenerator: (req) => {
          // Use IP + User-Agent for better tracking
          return `${req.ip}-${req.get("User-Agent")}`;
        },
      }),

      // Moderate rate limiting for API endpoints
      apiLimiter: rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 30, // 30 requests per minute
        message: {
          error: "Too many requests",
          retryAfter: "1 minute",
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
      }),

      // Strict rate limiting for sensitive operations
      sensitiveLimiter: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 attempts per hour
        message: {
          error: "Too many sensitive operations",
          retryAfter: "1 hour",
        },
        standardHeaders: true,
        legacyHeaders: false,
      }),

      // General rate limiting for public endpoints
      publicLimiter: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per 15 minutes
        message: {
          error: "Too many requests",
          retryAfter: "15 minutes",
        },
        standardHeaders: true,
        legacyHeaders: false,
      }),
    };
  }

  // Enhanced helmet configuration
  static createHelmetConfig() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          manifestSrc: ["'self'"],
          workerSrc: ["'self'"],
          childSrc: ["'none'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    });
  }

  // Input sanitization
  static sanitizeInput(req, res, next) {
    const sanitize = (obj) => {
      if (typeof obj === "string") {
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<[^>]*>/g, "")
          .trim();
      }
      if (typeof obj === "object" && obj !== null) {
        const sanitized = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitize(obj[key]);
          }
        }
        return sanitized;
      }
      return obj;
    };

    if (req.body) {
      req.body = sanitize(req.body);
    }
    if (req.query) {
      req.query = sanitize(req.query);
    }
    if (req.params) {
      req.params = sanitize(req.params);
    }

    next();
  }

  // Request size limiter
  static requestSizeLimiter(maxSize = "10mb") {
    return (req, res, next) => {
      const contentLength = parseInt(req.get("content-length") || "0");
      const maxBytes = parseInt(maxSize) * 1024 * 1024; // Convert MB to bytes

      if (contentLength > maxBytes) {
        return res.status(413).json({
          error: "Request entity too large",
          maxSize: maxSize,
        });
      }

      next();
    };
  }

  // Security headers middleware
  static securityHeaders(req, res, next) {
    // Remove X-Powered-By header
    res.removeHeader("X-Powered-By");

    // Add security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );

    // Add nonce for CSP
    const nonce = crypto.randomBytes(16).toString("base64");
    res.locals.nonce = nonce;

    next();
  }

  // IP whitelist middleware
  static ipWhitelist(allowedIPs = []) {
    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;

      if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
        return res.status(403).json({
          error: "Access denied",
          message: "Your IP address is not authorized",
        });
      }

      next();
    };
  }

  // Request logging for security monitoring
  static securityLogger(req, res, next) {
    const startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        statusCode: res.statusCode,
        duration: duration,
        userId: req.user ? req.user._id : null,
      };

      // Log suspicious activities
      if (res.statusCode >= 400) {
        console.warn("Security Event:", JSON.stringify(logData));
      }

      // Log all requests in production
      if (process.env.NODE_ENV === "production") {
        console.log("Request Log:", JSON.stringify(logData));
      }
    });

    next();
  }

  // Environment validation
  static validateEnvironment() {
    const requiredEnvVars = [
      "MONGODB_URI",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_KEY",
      "JWT_SECRET",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }

    // Validate JWT secret strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long");
    }

    return true;
  }

  // Enhanced validation middleware
  static createValidationMiddleware() {
    return {
      // Email validation with additional checks
      emailValidation: body("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address")
        .isLength({ max: 254 })
        .withMessage("Email address is too long"),

      // Password validation with strength requirements
      passwordValidation: body("password")
        .isLength({ min: 8, max: 128 })
        .withMessage("Password must be between 8 and 128 characters")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
        )
        .withMessage(
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),

      // Blood type validation
      bloodTypeValidation: body("bloodType")
        .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
        .withMessage("Invalid blood type"),

      // Phone number validation
      phoneValidation: body("phone")
        .optional()
        .isMobilePhone()
        .withMessage("Please provide a valid phone number"),

      // Location validation
      locationValidation: [
        body("location.city")
          .notEmpty()
          .withMessage("City is required")
          .isLength({ max: 100 })
          .withMessage("City name is too long"),
        body("location.state")
          .notEmpty()
          .withMessage("State is required")
          .isLength({ max: 100 })
          .withMessage("State name is too long"),
      ],

      // Age validation
      ageValidation: body("age")
        .isInt({ min: 0, max: 120 })
        .withMessage("Age must be between 0 and 120"),

      // Units validation
      unitsValidation: body("units")
        .isInt({ min: 1, max: 10 })
        .withMessage("Units must be between 1 and 10"),
    };
  }

  // Error handling for security
  static securityErrorHandler(err, req, res, next) {
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === "development";

    // Log the full error for debugging
    console.error("Security Error:", {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    });

    // Return generic error message to client
    res.status(500).json({
      error: "Internal server error",
      message: isDevelopment ? err.message : "Something went wrong",
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = SecurityMiddleware;
