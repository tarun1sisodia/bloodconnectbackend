const cors = require("cors");
const environmentConfig = require("../config/environment");

// Enhanced CORS security configuration
class CORSecurity {
  // Create secure CORS configuration
  static createSecureCORS() {
    const config = environmentConfig.getCorsConfig();

    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
          return callback(null, true);
        }

        // Check if origin is in allowed list
        if (config.ORIGINS.includes(origin)) {
          return callback(null, true);
        }

        // In development, allow localhost with any port
        if (environmentConfig.isDevelopment()) {
          const localhostRegex = /^https?:\/\/localhost(:\d+)?$/;
          const localhostIPRegex = /^https?:\/\/127\.0\.0\.1(:\d+)?$/;

          if (localhostRegex.test(origin) || localhostIPRegex.test(origin)) {
            return callback(null, true);
          }
        }

        // Log blocked origins for security monitoring
        console.warn(`🚫 Blocked CORS request from: ${origin}`);

        return callback(new Error("Not allowed by CORS policy"), false);
      },

      credentials: config.CREDENTIALS,
      optionsSuccessStatus: config.OPTIONS_SUCCESS_STATUS,

      // Additional security headers
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "Cache-Control",
        "Pragma",
      ],
      exposedHeaders: [
        "X-Total-Count",
        "X-Rate-Limit-Remaining",
        "X-Rate-Limit-Reset",
      ],

      // Security options
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 200,
    });
  }

  // CORS error handler
  static corsErrorHandler(err, req, res, next) {
    if (err.message === "Not allowed by CORS policy") {
      return res.status(403).json({
        error: "CORS Error",
        message: "Origin not allowed by CORS policy",
        origin: req.get("Origin"),
        timestamp: new Date().toISOString(),
      });
    }

    next(err);
  }

  // Validate origin for specific routes
  static validateOrigin(allowedOrigins) {
    return (req, res, next) => {
      const origin = req.get("Origin");

      if (!origin) {
        return next();
      }

      if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({
          error: "Origin not allowed",
          message: "Your origin is not authorized to access this resource",
        });
      }

      next();
    };
  }

  // API key validation for external services
  static validateAPIKey(apiKeyHeader = "X-API-Key") {
    return (req, res, next) => {
      const apiKey = req.get(apiKeyHeader);

      if (!apiKey) {
        return res.status(401).json({
          error: "API Key required",
          message: "Please provide a valid API key",
        });
      }

      // Validate API key format and existence
      if (!this.isValidAPIKey(apiKey)) {
        return res.status(401).json({
          error: "Invalid API Key",
          message: "The provided API key is invalid",
        });
      }

      next();
    };
  }

  // Check if API key is valid
  static isValidAPIKey(apiKey) {
    // Implement your API key validation logic here
    // This could check against a database, environment variables, etc.
    const validKeys = process.env.VALID_API_KEYS?.split(",") || [];
    return validKeys.includes(apiKey);
  }

  // Rate limiting for specific origins
  static createOriginRateLimit() {
    const rateLimit = require("express-rate-limit");

    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: (req) => {
        const origin = req.get("Origin");

        // Different limits for different origins
        if (origin && origin.includes("localhost")) {
          return 1000; // Higher limit for localhost
        }

        if (origin && origin.includes("github.io")) {
          return 100; // Medium limit for GitHub Pages
        }

        return 50; // Lower limit for unknown origins
      },
      message: {
        error: "Too many requests from this origin",
        message: "Please try again later",
      },
      keyGenerator: (req) => {
        return req.get("Origin") || req.ip;
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  // Security headers for CORS
  static securityHeaders(req, res, next) {
    const origin = req.get("Origin");

    if (origin) {
      // Set CORS headers
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma"
      );
      res.setHeader(
        "Access-Control-Expose-Headers",
        "X-Total-Count, X-Rate-Limit-Remaining, X-Rate-Limit-Reset"
      );
      res.setHeader("Access-Control-Max-Age", "86400");
    }

    // Additional security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    next();
  }

  // Preflight request handler
  static handlePreflight(req, res, next) {
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    next();
  }

  // Log CORS requests for monitoring
  static logCORSRequests(req, res, next) {
    const origin = req.get("Origin");
    const userAgent = req.get("User-Agent");

    if (origin) {
      console.log(`🌐 CORS Request: ${req.method} ${req.path} from ${origin}`);

      // Log suspicious patterns
      if (this.isSuspiciousOrigin(origin)) {
        console.warn(`⚠️ Suspicious CORS request from: ${origin}`);
      }
    }

    next();
  }

  // Check for suspicious origins
  static isSuspiciousOrigin(origin) {
    const suspiciousPatterns = [
      /localhost:\d{4,5}/, // Non-standard localhost ports
      /127\.0\.0\.1:\d{4,5}/, // Non-standard localhost IP ports
      /\.onion$/, // Tor domains
      /\.tk$/, // Free domains
      /\.ml$/, // Free domains
      /\.ga$/, // Free domains
      /\.cf$/, // Free domains
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(origin));
  }

  // Create CORS middleware for specific routes
  static createRouteCORS(allowedOrigins, options = {}) {
    return cors({
      origin: allowedOrigins,
      credentials: options.credentials || true,
      methods: options.methods || ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: options.allowedHeaders || [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
      ],
      exposedHeaders: options.exposedHeaders || [],
      maxAge: options.maxAge || 86400,
    });
  }
}

module.exports = CORSecurity;
