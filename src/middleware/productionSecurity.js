const productionSecurity = require("../config/production");
const securityLogger = require("../utils/securityLogger");

// Production security middleware
class ProductionSecurityMiddleware {
  // Apply production security headers
  static applySecurityHeaders(req, res, next) {
    const headers = productionSecurity.getConfig().securityHeaders;

    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    next();
  }

  // Production rate limiting
  static createProductionRateLimit() {
    const rateLimit = require("express-rate-limit");
    const config = productionSecurity.getConfig().rateLimiting;

    return rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      message: {
        error: "Too many requests",
        message: "Please try again later",
        retryAfter: Math.ceil(config.windowMs / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: config.skipSuccessfulRequests,
      skipFailedRequests: config.skipFailedRequests,
      keyGenerator: config.keyGenerator,
      handler: (req, res) => {
        securityLogger.logRateLimit(req, config.max, 0);
        res.status(429).json({
          error: "Rate limit exceeded",
          message: "Too many requests from this IP",
          retryAfter: Math.ceil(config.windowMs / 1000),
        });
      },
    });
  }

  // Production CORS configuration
  static createProductionCORS() {
    const cors = require("cors");
    const config = productionSecurity.getConfig().cors;

    return cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (config.origin.includes(origin)) {
          return callback(null, true);
        }

        securityLogger.logSecurityEvent("CORS_BLOCKED", {
          origin,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });

        return callback(new Error("Not allowed by CORS policy"), false);
      },
      credentials: config.credentials,
      optionsSuccessStatus: config.optionsSuccessStatus,
      methods: config.methods,
      allowedHeaders: config.allowedHeaders,
    });
  }

  // Request size limiting
  static requestSizeLimiter() {
    return (req, res, next) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const contentLength = parseInt(req.get("content-length") || "0");

      if (contentLength > maxSize) {
        return res.status(413).json({
          error: "Request too large",
          message: "Request size exceeds maximum allowed size",
        });
      }

      next();
    };
  }

  // Security monitoring
  static securityMonitoring(req, res, next) {
    const startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startTime;

      // Log all requests
      securityLogger.logAccess(req, res, duration);

      // Log suspicious activity
      if (res.statusCode >= 400) {
        securityLogger.logSecurityEvent("HTTP_ERROR", {
          statusCode: res.statusCode,
          url: req.url,
          method: req.method,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }

      // Log slow requests
      if (duration > 5000) {
        // 5 seconds
        securityLogger.logSecurityEvent("SLOW_REQUEST", {
          duration,
          url: req.url,
          method: req.method,
          ip: req.ip,
        });
      }
    });

    next();
  }

  // Input validation and sanitization
  static inputValidation(req, res, next) {
    // Sanitize request body
    if (req.body && typeof req.body === "object") {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === "object") {
      req.query = this.sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === "object") {
      req.params = this.sanitizeObject(req.params);
    }

    next();
  }

  // Sanitize object recursively
  static sanitizeObject(obj) {
    if (typeof obj !== "object" || obj === null) {
      return this.sanitizeString(obj);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === "object") {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Sanitize string
  static sanitizeString(str) {
    if (typeof str !== "string") return str;

    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim();
  }

  // Error handling
  static errorHandler(err, req, res, next) {
    // Log error
    securityLogger.logError(err, req);

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === "development";

    res.status(500).json({
      error: "Internal server error",
      message: isDevelopment ? err.message : "Something went wrong",
      timestamp: new Date().toISOString(),
    });
  }

  // Health check endpoint
  static healthCheck(req, res) {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  }

  // Metrics endpoint
  static metrics(req, res) {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: process.env.NODE_ENV,
    };

    res.status(200).json(metrics);
  }

  // Status endpoint
  static status(req, res) {
    const status = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV,
      security: {
        helmet: true,
        cors: true,
        rateLimit: true,
        inputValidation: true,
      },
    };

    res.status(200).json(status);
  }
}

module.exports = ProductionSecurityMiddleware;
