const fs = require("fs");
const path = require("path");
const environmentConfig = require("../config/environment");
const encryptionUtils = require("./encryption");

// Enhanced security logging and monitoring
class SecurityLogger {
  constructor() {
    this.logDir = path.join(__dirname, "../../logs");
    this.securityLogFile = path.join(this.logDir, "security.log");
    this.accessLogFile = path.join(this.logDir, "access.log");
    this.errorLogFile = path.join(this.logDir, "error.log");

    this.ensureLogDirectory();
    this.setupLogRotation();
  }

  // Ensure log directory exists
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // Setup log rotation
  setupLogRotation() {
    // Rotate logs daily
    setInterval(() => {
      this.rotateLogs();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  // Rotate log files
  rotateLogs() {
    const date = new Date().toISOString().split("T")[0];

    [this.securityLogFile, this.accessLogFile, this.errorLogFile].forEach(
      (logFile) => {
        if (fs.existsSync(logFile)) {
          const rotatedFile = logFile.replace(".log", `-${date}.log`);
          fs.renameSync(logFile, rotatedFile);
        }
      }
    );
  }

  // Log security events
  logSecurityEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details: encryptionUtils.sanitizeForLogging(details),
      severity: this.getSeverityLevel(event),
    };

    this.writeToFile(this.securityLogFile, logEntry);

    // Also log to console for immediate visibility
    if (logEntry.severity === "HIGH" || logEntry.severity === "CRITICAL") {
      console.error(`🚨 SECURITY ALERT: ${event}`, details);
    }
  }

  // Log access events
  logAccess(req, res, responseTime) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      statusCode: res.statusCode,
      responseTime: responseTime,
      userId: req.user ? req.user._id : null,
      sessionId: req.sessionID || null,
    };

    this.writeToFile(this.accessLogFile, logEntry);
  }

  // Log errors
  logError(error, req = null, additionalInfo = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      request: req
        ? {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            userId: req.user ? req.user._id : null,
          }
        : null,
      additionalInfo: encryptionUtils.sanitizeForLogging(additionalInfo),
    };

    this.writeToFile(this.errorLogFile, logEntry);

    // Also log to console
    console.error("❌ Error logged:", error.message);
  }

  // Write to log file
  writeToFile(filePath, data) {
    try {
      const logLine = JSON.stringify(data) + "\n";
      fs.appendFileSync(filePath, logLine);
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  // Get severity level for security events
  getSeverityLevel(event) {
    const highSeverityEvents = [
      "LOGIN_FAILURE",
      "UNAUTHORIZED_ACCESS",
      "SUSPICIOUS_ACTIVITY",
      "ACCOUNT_LOCKED",
      "PASSWORD_RESET_ATTEMPT",
      "INVALID_TOKEN",
      "RATE_LIMIT_EXCEEDED",
    ];

    const criticalSeverityEvents = [
      "SECURITY_BREACH",
      "DATA_BREACH",
      "UNAUTHORIZED_DATA_ACCESS",
      "MALICIOUS_REQUEST",
      "SQL_INJECTION_ATTEMPT",
      "XSS_ATTEMPT",
    ];

    if (criticalSeverityEvents.includes(event)) {
      return "CRITICAL";
    }

    if (highSeverityEvents.includes(event)) {
      return "HIGH";
    }

    return "MEDIUM";
  }

  // Log authentication events
  logAuthEvent(event, userId, details = {}) {
    this.logSecurityEvent(`AUTH_${event}`, {
      userId,
      ...details,
    });
  }

  // Log suspicious activity
  logSuspiciousActivity(activity, req, details = {}) {
    this.logSecurityEvent("SUSPICIOUS_ACTIVITY", {
      activity,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
      method: req.method,
      userId: req.user ? req.user._id : null,
      ...details,
    });
  }

  // Log rate limiting events
  logRateLimit(req, limit, remaining) {
    this.logSecurityEvent("RATE_LIMIT_EXCEEDED", {
      ip: req.ip,
      url: req.url,
      method: req.method,
      limit,
      remaining,
      userAgent: req.get("User-Agent"),
    });
  }

  // Log data access events
  logDataAccess(userId, resource, action, details = {}) {
    this.logSecurityEvent("DATA_ACCESS", {
      userId,
      resource,
      action,
      ...details,
    });
  }

  // Log file upload events
  logFileUpload(userId, fileName, fileSize, fileType) {
    this.logSecurityEvent("FILE_UPLOAD", {
      userId,
      fileName,
      fileSize,
      fileType,
    });
  }

  // Log API usage
  logAPIUsage(endpoint, method, userId, responseTime, statusCode) {
    this.logSecurityEvent("API_USAGE", {
      endpoint,
      method,
      userId,
      responseTime,
      statusCode,
    });
  }

  // Get security metrics
  getSecurityMetrics(timeframe = "24h") {
    const cutoffTime = new Date(Date.now() - this.getTimeframeMs(timeframe));
    const logs = this.readLogFile(this.securityLogFile);

    const metrics = {
      totalEvents: 0,
      criticalEvents: 0,
      highSeverityEvents: 0,
      mediumSeverityEvents: 0,
      eventsByType: {},
      topIPs: {},
      topUserAgents: {},
    };

    logs.forEach((log) => {
      if (new Date(log.timestamp) < cutoffTime) return;

      metrics.totalEvents++;

      if (log.severity === "CRITICAL") metrics.criticalEvents++;
      else if (log.severity === "HIGH") metrics.highSeverityEvents++;
      else if (log.severity === "MEDIUM") metrics.mediumSeverityEvents++;

      // Count events by type
      const eventType = log.event.split("_")[0];
      metrics.eventsByType[eventType] =
        (metrics.eventsByType[eventType] || 0) + 1;

      // Count IPs
      if (log.details.ip) {
        metrics.topIPs[log.details.ip] =
          (metrics.topIPs[log.details.ip] || 0) + 1;
      }

      // Count User Agents
      if (log.details.userAgent) {
        metrics.topUserAgents[log.details.userAgent] =
          (metrics.topUserAgents[log.details.userAgent] || 0) + 1;
      }
    });

    return metrics;
  }

  // Read log file
  readLogFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return [];

      const content = fs.readFileSync(filePath, "utf8");
      return content
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
    } catch (error) {
      console.error("Error reading log file:", error);
      return [];
    }
  }

  // Get timeframe in milliseconds
  getTimeframeMs(timeframe) {
    const timeframes = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    return timeframes[timeframe] || timeframes["24h"];
  }

  // Monitor for security threats
  monitorSecurityThreats() {
    const metrics = this.getSecurityMetrics("1h");

    // Alert if too many critical events
    if (metrics.criticalEvents > 5) {
      console.error(
        "🚨 ALERT: High number of critical security events detected!"
      );
      this.logSecurityEvent("SECURITY_ALERT", {
        message: "High number of critical events",
        criticalEvents: metrics.criticalEvents,
      });
    }

    // Alert if suspicious IP activity
    const suspiciousIPs = Object.entries(metrics.topIPs)
      .filter(([ip, count]) => count > 10)
      .map(([ip, count]) => ({ ip, count }));

    if (suspiciousIPs.length > 0) {
      console.warn("⚠️ Suspicious IP activity detected:", suspiciousIPs);
      this.logSecurityEvent("SUSPICIOUS_IP_ACTIVITY", {
        suspiciousIPs,
      });
    }
  }

  // Setup monitoring
  setupMonitoring() {
    // Monitor every 5 minutes
    setInterval(() => {
      this.monitorSecurityThreats();
    }, 5 * 60 * 1000);
  }
}

// Create singleton instance
const securityLogger = new SecurityLogger();

// Setup monitoring
securityLogger.setupMonitoring();

module.exports = securityLogger;
