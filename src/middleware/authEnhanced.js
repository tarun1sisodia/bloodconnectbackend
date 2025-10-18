const { createClient } = require("@supabase/supabase-js");
const User = require("../models/User");
const environmentConfig = require("../config/environment");
const crypto = require("crypto");

// Enhanced authentication middleware with security improvements
class EnhancedAuth {
  constructor() {
    this.supabase = createClient(
      environmentConfig.config.SUPABASE.URL,
      environmentConfig.config.SUPABASE.SERVICE_KEY
    );

    // Token blacklist for logout functionality
    this.tokenBlacklist = new Set();

    // Login attempt tracking
    this.loginAttempts = new Map();

    // Session tracking
    this.activeSessions = new Map();
  }

  // Enhanced authentication middleware
  async authenticate(req, res, next) {
    try {
      const authHeader = req.header("Authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please provide a valid authorization token",
        });
      }

      const token = authHeader.replace("Bearer ", "");

      // Check if token is blacklisted
      if (this.isTokenBlacklisted(token)) {
        return res.status(401).json({
          error: "Token invalid",
          message: "This token has been revoked",
        });
      }

      // Verify token with Supabase
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          error: "Invalid token",
          message: "Token is invalid or expired",
        });
      }

      // Find user in MongoDB
      const mongoUser = await User.findOne({ supabaseId: user.id });

      if (!mongoUser) {
        return res.status(404).json({
          error: "User not found",
          message: "User account not found",
        });
      }

      // Check if user account is locked
      if (mongoUser.isLocked) {
        return res.status(423).json({
          error: "Account locked",
          message:
            "Your account has been temporarily locked due to suspicious activity",
        });
      }

      // Update last activity
      mongoUser.lastActivity = new Date();
      await mongoUser.save();

      // Set user data in request
      req.user = mongoUser;
      req.supabaseUser = user;
      req.token = token;

      // Track active session
      this.trackSession(mongoUser._id, token);

      next();
    } catch (error) {
      console.error("Enhanced auth error:", error);
      res.status(500).json({
        error: "Authentication failed",
        message: "Internal server error during authentication",
      });
    }
  }

  // Role-based authorization
  requireRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to access this resource",
        });
      }

      const userRole = req.user.role || "user";
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: "Access denied",
          message: "You do not have permission to access this resource",
        });
      }

      next();
    };
  }

  // Permission-based authorization
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to access this resource",
        });
      }

      const userPermissions = req.user.permissions || [];

      if (!userPermissions.includes(permission)) {
        return res.status(403).json({
          error: "Permission denied",
          message: `You need ${permission} permission to access this resource`,
        });
      }

      next();
    };
  }

  // Resource ownership check
  requireOwnership(resourceField = "userId") {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to access this resource",
        });
      }

      const resourceUserId =
        req.params[resourceField] || req.body[resourceField];

      if (resourceUserId && resourceUserId !== req.user._id.toString()) {
        return res.status(403).json({
          error: "Access denied",
          message: "You can only access your own resources",
        });
      }

      next();
    };
  }

  // Enhanced login with attempt tracking
  async loginWithTracking(email, password, req) {
    const clientIP = req.ip;
    const attemptKey = `${email}-${clientIP}`;

    // Check for too many attempts
    const attempts = this.loginAttempts.get(attemptKey) || {
      count: 0,
      lastAttempt: 0,
    };
    const now = Date.now();

    // Reset attempts after lockout time
    if (
      now - attempts.lastAttempt >
      environmentConfig.config.SECURITY.LOCKOUT_TIME
    ) {
      attempts.count = 0;
    }

    if (
      attempts.count >= environmentConfig.config.SECURITY.MAX_LOGIN_ATTEMPTS
    ) {
      throw new Error("Too many login attempts. Please try again later.");
    }

    try {
      // Attempt login
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        // Increment failed attempts
        attempts.count++;
        attempts.lastAttempt = now;
        this.loginAttempts.set(attemptKey, attempts);

        throw new Error("Invalid email or password");
      }

      // Reset attempts on successful login
      this.loginAttempts.delete(attemptKey);

      return data;
    } catch (error) {
      // Increment failed attempts
      attempts.count++;
      attempts.lastAttempt = now;
      this.loginAttempts.set(attemptKey, attempts);

      throw error;
    }
  }

  // Enhanced registration with security checks
  async registerWithSecurity(userData, req) {
    const { email, password, name, bloodType } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Validate password strength
    this.validatePasswordStrength(password);

    // Register with Supabase
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          bloodType,
        },
      },
    });

    if (error || !data.user) {
      throw new Error(
        "Registration failed: " + (error?.message || "Unknown error")
      );
    }

    // Create user in MongoDB
    const user = new User({
      supabaseId: data.user.id,
      email,
      name,
      bloodType,
      role: "user",
      permissions: ["read:own", "write:own"],
      isActive: true,
      isLocked: false,
      loginAttempts: 0,
      lastActivity: new Date(),
    });

    await user.save();

    return { user, supabaseData: data };
  }

  // Password strength validation
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new Error("Password must be at least 8 characters long");
    }

    if (!hasUpperCase) {
      throw new Error("Password must contain at least one uppercase letter");
    }

    if (!hasLowerCase) {
      throw new Error("Password must contain at least one lowercase letter");
    }

    if (!hasNumbers) {
      throw new Error("Password must contain at least one number");
    }

    if (!hasSpecialChar) {
      throw new Error("Password must contain at least one special character");
    }
  }

  // Token blacklist management
  blacklistToken(token) {
    this.tokenBlacklist.add(token);

    // Remove from blacklist after TTL
    setTimeout(() => {
      this.tokenBlacklist.delete(token);
    }, environmentConfig.config.SECURITY.TOKEN_BLACKLIST_TTL);
  }

  isTokenBlacklisted(token) {
    return this.tokenBlacklist.has(token);
  }

  // Session management
  trackSession(userId, token) {
    const sessionId = crypto.randomBytes(16).toString("hex");
    this.activeSessions.set(sessionId, {
      userId,
      token,
      createdAt: new Date(),
      lastActivity: new Date(),
    });

    return sessionId;
  }

  // Logout with session cleanup
  async logout(token) {
    // Blacklist the token
    this.blacklistToken(token);

    // Remove from active sessions
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.token === token) {
        this.activeSessions.delete(sessionId);
        break;
      }
    }
  }

  // Account lockout management
  async lockAccount(userId, reason = "Suspicious activity") {
    const user = await User.findById(userId);
    if (user) {
      user.isLocked = true;
      user.lockReason = reason;
      user.lockedAt = new Date();
      await user.save();
    }
  }

  async unlockAccount(userId) {
    const user = await User.findById(userId);
    if (user) {
      user.isLocked = false;
      user.lockReason = null;
      user.lockedAt = null;
      user.loginAttempts = 0;
      await user.save();
    }
  }

  // Ensure user exists in MongoDB (used after Supabase auth)
  async ensureUserInMongoDB(req, res, next) {
    try {
      if (!req.supabaseUser) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to access this resource",
        });
      }

      // Check if user exists in MongoDB
      let user = await User.findOne({ supabaseId: req.supabaseUser.id });

      // If user doesn't exist, create a basic record
      if (!user) {
        user = new User({
          supabaseId: req.supabaseUser.id,
          email: req.supabaseUser.email,
          name: req.supabaseUser.user_metadata?.name || "New User",
          profileComplete: false,
          role: "user",
          permissions: ["read:own", "write:own"],
          isActive: true,
          isLocked: false,
          loginAttempts: 0,
          lastActivity: new Date(),
        });

        await user.save();
      }

      // Update req.user with MongoDB user
      req.user = user;

      next();
    } catch (error) {
      console.error("ensureUserInMongoDB error:", error);
      res.status(500).json({
        error: "User verification failed",
        message: "Internal server error during user verification",
      });
    }
  }

  // Clean up expired sessions
  cleanupExpiredSessions() {
    const now = new Date();
    const sessionTTL = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > sessionTTL) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  // Get active sessions for a user
  getActiveSessions(userId) {
    const userSessions = [];
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        userSessions.push({
          sessionId,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
        });
      }
    }
    return userSessions;
  }
}

// Create singleton instance
const enhancedAuth = new EnhancedAuth();

// Clean up expired sessions every hour
setInterval(() => {
  enhancedAuth.cleanupExpiredSessions();
}, 60 * 60 * 1000);

module.exports = enhancedAuth;
