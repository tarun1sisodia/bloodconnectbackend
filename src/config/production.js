const environmentConfig = require("./environment");

// Production security configuration
class ProductionSecurity {
  constructor() {
    this.config = this.loadProductionConfig();
  }

  loadProductionConfig() {
    return {
      // Database security
      database: {
        uri: environmentConfig.config.MONGODB_URI,
        options: {
          ...environmentConfig.config.MONGODB_OPTIONS,
          // Additional production database security
          ssl: true,
          sslValidate: true,
          authSource: "admin",
          retryWrites: true,
          w: "majority",
          readPreference: "secondaryPreferred",
        },
      },

      // Security headers
      securityHeaders: {
        "Strict-Transport-Security":
          "max-age=31536000; includeSubDomains; preload",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        "Content-Security-Policy": this.getCSPHeader(),
      },

      // Rate limiting
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        keyGenerator: (req) => {
          return req.ip + req.get("User-Agent");
        },
      },

      // CORS configuration
      cors: {
        origin: environmentConfig.config.CORS.ORIGINS,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Origin",
          "X-Requested-With",
          "Content-Type",
          "Accept",
          "Authorization",
          "Cache-Control",
          "Pragma",
        ],
      },

      // Session configuration
      session: {
        secret: environmentConfig.config.SECURITY.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: true,
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: "strict",
        },
      },

      // Logging configuration
      logging: {
        level: "warn",
        enableSecurityLogs: true,
        enableRequestLogs: true,
        logRotation: true,
        maxLogSize: "10MB",
        maxLogFiles: 5,
      },

      // Monitoring
      monitoring: {
        enableMetrics: true,
        metricsPort: environmentConfig.config.MONITORING.METRICS_PORT,
        healthCheckInterval: 30000, // 30 seconds
        alertThresholds: {
          errorRate: 0.05, // 5%
          responseTime: 2000, // 2 seconds
          memoryUsage: 0.8, // 80%
        },
      },

      // File upload security
      fileUpload: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/png", "image/gif"],
        uploadDir: "/tmp/uploads",
        virusScan: true,
        quarantineDir: "/tmp/quarantine",
      },

      // API security
      api: {
        version: "v1",
        basePath: "/api",
        timeout: 30000, // 30 seconds
        maxRequestSize: "10mb",
        enableCompression: true,
        enableCaching: true,
        cacheTTL: 300, // 5 minutes
      },
    };
  }

  // Get Content Security Policy header
  getCSPHeader() {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "media-src 'self'",
      "manifest-src 'self'",
      "worker-src 'self'",
      "child-src 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join("; ");
  }

  // Get production configuration
  getConfig() {
    return this.config;
  }

  // Validate production environment
  validateProductionEnvironment() {
    const requiredVars = [
      "MONGODB_URI",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_KEY",
      "JWT_SECRET",
      "SESSION_SECRET",
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required production environment variables: ${missingVars.join(
          ", "
        )}`
      );
    }

    // Validate JWT secret strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error(
        "JWT_SECRET must be at least 32 characters long for production"
      );
    }

    // Validate MongoDB URI
    if (!process.env.MONGODB_URI.startsWith("mongodb+srv://")) {
      console.warn("⚠️ Warning: Using non-Atlas MongoDB URI in production");
    }

    return true;
  }

  // Get security middleware configuration
  getSecurityMiddlewareConfig() {
    return {
      helmet: {
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
      },

      cors: this.config.cors,

      rateLimit: this.config.rateLimiting,
    };
  }

  // Get monitoring configuration
  getMonitoringConfig() {
    return {
      ...this.config.monitoring,
      endpoints: {
        health: "/health",
        metrics: "/metrics",
        status: "/status",
      },
      alerts: {
        email: process.env.ALERT_EMAIL,
        webhook: process.env.ALERT_WEBHOOK,
      },
    };
  }

  // Get database configuration
  getDatabaseConfig() {
    return this.config.database;
  }

  // Get session configuration
  getSessionConfig() {
    return this.config.session;
  }

  // Get file upload configuration
  getFileUploadConfig() {
    return this.config.fileUpload;
  }

  // Get API configuration
  getAPIConfig() {
    return this.config.api;
  }
}

// Create singleton instance
const productionSecurity = new ProductionSecurity();

module.exports = productionSecurity;
