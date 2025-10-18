const path = require("path");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Environment validation and configuration
class EnvironmentConfig {
  constructor() {
    this.validateEnvironment();
    this.config = this.loadConfiguration();
  }

  validateEnvironment() {
    const requiredVars = [
      "MONGODB_URI",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_KEY",
      "JWT_SECRET",
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }

    // Validate JWT secret strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error(
        "JWT_SECRET must be at least 32 characters long for security"
      );
    }

    // Validate MongoDB URI format
    if (
      !process.env.MONGODB_URI.startsWith("mongodb://") &&
      !process.env.MONGODB_URI.startsWith("mongodb+srv://")
    ) {
      throw new Error("MONGODB_URI must be a valid MongoDB connection string");
    }

    // Validate Supabase URL format
    if (!process.env.SUPABASE_URL.startsWith("https://")) {
      throw new Error("SUPABASE_URL must be a valid HTTPS URL");
    }

    console.log("✅ Environment validation passed");
  }

  loadConfiguration() {
    const isProduction = process.env.NODE_ENV === "production";
    const isDevelopment = process.env.NODE_ENV === "development";
    const isTest = process.env.NODE_ENV === "test";

    return {
      // Environment
      NODE_ENV: process.env.NODE_ENV || "development",
      PORT: parseInt(process.env.PORT) || 5000,

      // Database
      MONGODB_URI: process.env.MONGODB_URI,
      MONGODB_OPTIONS: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false,
      },

      // Supabase
      SUPABASE: {
        URL: process.env.SUPABASE_URL,
        SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
        ANON_KEY: process.env.SUPABASE_ANON_KEY,
      },

      // JWT Configuration
      JWT: {
        SECRET: process.env.JWT_SECRET,
        EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
        REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      },

      // CORS Configuration
      CORS: {
        ORIGINS: this.getCorsOrigins(),
        CREDENTIALS: true,
        OPTIONS_SUCCESS_STATUS: 200,
      },

      // Rate Limiting
      RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: isProduction ? 100 : 1000,
        AUTH_MAX_REQUESTS: 5,
        SENSITIVE_MAX_REQUESTS: 10,
      },

      // Security
      SECURITY: {
        BCRYPT_ROUNDS: 12,
        SESSION_SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET,
        TOKEN_BLACKLIST_TTL: 24 * 60 * 60 * 1000, // 24 hours
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes
      },

      // Email Configuration
      EMAIL: {
        HOST: process.env.EMAIL_HOST,
        PORT: parseInt(process.env.EMAIL_PORT) || 587,
        SECURE: process.env.EMAIL_SECURE === "true",
        USER: process.env.EMAIL_USER,
        PASS: process.env.EMAIL_PASS,
        FROM: process.env.EMAIL_FROM,
      },

      // Logging
      LOGGING: {
        LEVEL: isProduction ? "warn" : "debug",
        ENABLE_SECURITY_LOGS: true,
        ENABLE_REQUEST_LOGS: isProduction,
      },

      // File Upload
      UPLOAD: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ["image/jpeg", "image/png", "image/gif"],
        UPLOAD_DIR: path.join(__dirname, "../../uploads"),
      },

      // Cache
      CACHE: {
        TTL: 300, // 5 minutes
        MAX_ITEMS: 1000,
      },

      // Monitoring
      MONITORING: {
        ENABLE_METRICS: isProduction,
        METRICS_PORT: parseInt(process.env.METRICS_PORT) || 9090,
      },
    };
  }

  getCorsOrigins() {
    const defaultOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    ];

    const productionOrigins = [
      "https://tarun1sisodia.netlify.app",
      "https://tarun1sisodia.github.io",
      "https://tarun1sisodia.github.io/bloodconnectfrontend",
    ];

    if (process.env.NODE_ENV === "production") {
      return process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
        : productionOrigins;
    }

    return process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
      : [...defaultOrigins, ...productionOrigins];
  }

  // Get configuration for specific environment
  getConfig() {
    return this.config;
  }

  // Check if running in production
  isProduction() {
    return this.config.NODE_ENV === "production";
  }

  // Check if running in development
  isDevelopment() {
    return this.config.NODE_ENV === "development";
  }

  // Check if running in test
  isTest() {
    return this.config.NODE_ENV === "test";
  }

  // Get database configuration
  getDatabaseConfig() {
    return {
      uri: this.config.MONGODB_URI,
      options: this.config.MONGODB_OPTIONS,
    };
  }

  // Get security configuration
  getSecurityConfig() {
    return this.config.SECURITY;
  }

  // Get CORS configuration
  getCorsConfig() {
    return this.config.CORS;
  }

  // Get rate limiting configuration
  getRateLimitConfig() {
    return this.config.RATE_LIMIT;
  }
}

// Create singleton instance
const environmentConfig = new EnvironmentConfig();

module.exports = environmentConfig;
