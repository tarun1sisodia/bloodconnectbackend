const crypto = require("crypto");
const environmentConfig = require("../config/environment");

// Data encryption and protection utilities
class EncryptionUtils {
  constructor() {
    this.algorithm = "aes-256-gcm";
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
    this.encryptionKey = this.getEncryptionKey();
  }

  // Get or generate encryption key
  getEncryptionKey() {
    const key = environmentConfig.config.SECURITY.ENCRYPTION_KEY;

    if (!key) {
      throw new Error("Encryption key not found in environment variables");
    }

    // Ensure key is exactly 32 bytes
    return crypto.scryptSync(key, "salt", this.keyLength);
  }

  // Encrypt sensitive data
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      const tag = cipher.getAuthTag();

      return {
        encrypted: encrypted,
        iv: iv.toString("hex"),
        tag: tag.toString("hex"),
      };
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData) {
    try {
      const decipher = crypto.createDecipher(
        this.algorithm,
        this.encryptionKey
      );

      decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"));

      let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  // Hash sensitive data (one-way)
  hash(text, salt = null) {
    const actualSalt = salt || crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(text, actualSalt, 10000, 64, "sha512");

    return {
      hash: hash.toString("hex"),
      salt: actualSalt,
    };
  }

  // Verify hashed data
  verifyHash(text, hash, salt) {
    const newHash = this.hash(text, salt);
    return newHash.hash === hash;
  }

  // Generate secure random token
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  // Generate secure random string
  generateSecureString(length = 16) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  // Encrypt PII data
  encryptPII(data) {
    if (typeof data === "string") {
      return this.encrypt(data);
    }

    if (typeof data === "object" && data !== null) {
      const encrypted = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isPIIField(key)) {
          encrypted[key] = this.encrypt(value);
        } else {
          encrypted[key] = value;
        }
      }
      return encrypted;
    }

    return data;
  }

  // Decrypt PII data
  decryptPII(data) {
    if (typeof data === "object" && data !== null && data.encrypted) {
      return this.decrypt(data);
    }

    if (typeof data === "object" && data !== null) {
      const decrypted = {};
      for (const [key, value] of Object.entries(data)) {
        if (
          this.isPIIField(key) &&
          typeof value === "object" &&
          value.encrypted
        ) {
          decrypted[key] = this.decrypt(value);
        } else {
          decrypted[key] = value;
        }
      }
      return decrypted;
    }

    return data;
  }

  // Check if field contains PII
  isPIIField(fieldName) {
    const piiFields = [
      "email",
      "phone",
      "address",
      "ssn",
      "creditCard",
      "bankAccount",
      "passport",
      "driverLicense",
      "medicalRecord",
    ];

    return piiFields.some((field) =>
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }

  // Sanitize data for logging (remove PII)
  sanitizeForLogging(data) {
    if (typeof data === "string") {
      return this.maskSensitiveData(data);
    }

    if (typeof data === "object" && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isPIIField(key)) {
          sanitized[key] = this.maskSensitiveData(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return data;
  }

  // Mask sensitive data
  maskSensitiveData(data) {
    if (typeof data !== "string") {
      return "[MASKED]";
    }

    if (data.length <= 4) {
      return "*".repeat(data.length);
    }

    const visibleChars = Math.min(2, Math.floor(data.length / 4));
    const maskedLength = data.length - visibleChars;

    return data.substring(0, visibleChars) + "*".repeat(maskedLength);
  }

  // Generate secure password
  generateSecurePassword(length = 16) {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    const allChars = lowercase + uppercase + numbers + symbols;
    let password = "";

    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }

  // Validate password strength
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length;

    return {
      score,
      isStrong: score >= 4,
      requirements: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar,
      },
    };
  }

  // Create data integrity hash
  createIntegrityHash(data) {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash("sha256").update(dataString).digest("hex");
  }

  // Verify data integrity
  verifyIntegrityHash(data, expectedHash) {
    const actualHash = this.createIntegrityHash(data);
    return actualHash === expectedHash;
  }
}

// Create singleton instance
const encryptionUtils = new EncryptionUtils();

module.exports = encryptionUtils;
