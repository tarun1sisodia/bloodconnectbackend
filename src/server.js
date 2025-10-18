require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");

// Import enhanced security modules
const environmentConfig = require("./config/environment");
const SecurityMiddleware = require("./middleware/security");

// Import routes
const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");
const requestsRoutes = require("./routes/requestsRoutes");
const donationRoutes = require("./routes/donationRoutes");
const matchRoutes = require("./routes/matchRoutes");
const statsRoutes = require("./routes/statsRoutes");
const contactRoutes = require("./routes/contactRoutes");
const donationCenterRoutes = require("./routes/donationCenterRoutes");

// Import middleware
const { apiLimiter } = require("./middleware/rateLimit");

// Initialize Express app
const app = express();

// Enhanced security configuration
app.set("trust proxy", 1);

// Apply enhanced helmet configuration
app.use(SecurityMiddleware.createHelmetConfig());

// Apply security headers
app.use(SecurityMiddleware.securityHeaders);

// Apply request size limiting
app.use(SecurityMiddleware.requestSizeLimiter("10mb"));

// Apply input sanitization
app.use(SecurityMiddleware.sanitizeInput);

// Apply security logging
app.use(SecurityMiddleware.securityLogger);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Enhanced CORS configuration
app.use(cors(environmentConfig.getCorsConfig()));

// Enhanced rate limiting with different tiers
const rateLimiters = SecurityMiddleware.createRateLimiters();

// Apply different rate limits to different endpoints
app.use("/api/auth", rateLimiters.authLimiter);
app.use("/api/users", rateLimiters.apiLimiter);
app.use("/api/requests", rateLimiters.apiLimiter);
app.use("/api/donations", rateLimiters.sensitiveLimiter);
app.use("/api/match", rateLimiters.apiLimiter);
app.use("/api/stats", rateLimiters.publicLimiter);
app.use("/api/contact", rateLimiters.publicLimiter);
app.use("/api/donation-centers", rateLimiters.apiLimiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/donation-centers", donationCenterRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// For production environment
if (process.env.NODE_ENV === "production") {
  // Instead of serving static files, redirect non-API requests to GitHub Pages
  app.get("*", (req, res) => {
    // Only redirect requests that aren't for the API or health check
    if (!req.path.startsWith("/api/") && req.path !== "/health") {
      // const githubPagesUrl = process.env.FRONTEND_URL || 'https://tarun9105.github.io/ProjectUI/'|| 'https://tarun9105.github.io';
      const githubPagesUrl =
        process.env.FRONTEND_URL ||
        "https://tarun1sisodia.github.io/bloodconnectfrontend/" ||
        "https://tarun1sisodia.github.io";
      // Remove trailing slash if it exists to avoid double slashes
      const baseUrl = githubPagesUrl.endsWith("/")
        ? githubPagesUrl.slice(0, -1)
        : githubPagesUrl;
      res.redirect(`${baseUrl}${req.path}`);
    } else {
      // This will trigger the 404 handler for API routes that don't exist
      res.status(404).json({ message: "API endpoint not found" });
    }
  });
}

// Enhanced error handling middleware
app.use(SecurityMiddleware.securityErrorHandler);

// Connect to MongoDB with enhanced configuration
const dbConfig = environmentConfig.getDatabaseConfig();
mongoose
  .connect(dbConfig.uri, dbConfig.options)
  .then(() => {
    console.log("✅ Connected to MongoDB with enhanced security");

    // Start server
    const PORT = environmentConfig.config.PORT;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔒 Enhanced security features enabled`);
      console.log(`🌍 Environment: ${environmentConfig.config.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

module.exports = app;
