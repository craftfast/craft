import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Encryption key must be 32 bytes for AES-256
const ENCRYPTION_KEY = process.env.ENV_VAR_ENCRYPTION_KEY || "default-32-byte-key-for-dev-use"; // Must be 32 bytes
const IV_LENGTH = 16;

/**
 * Encrypt a string value using AES-256-CBC
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:encryptedData
 */
export function encryptValue(text: string): string {
    try {
        const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv("aes-256-cbc", key, iv);
        const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
        return iv.toString("hex") + ":" + encrypted.toString("hex");
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Failed to encrypt value");
    }
}

/**
 * Decrypt a string value encrypted with encryptValue
 * @param text - Encrypted string in format: iv:encryptedData
 * @returns Decrypted plain text
 */
export function decryptValue(text: string): string {
    try {
        const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
        const parts = text.split(":");
        if (parts.length !== 2) {
            throw new Error("Invalid encrypted format");
        }
        const iv = Buffer.from(parts[0], "hex");
        const encrypted = Buffer.from(parts[1], "hex");
        const decipher = createDecipheriv("aes-256-cbc", key, iv);
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]);
        return decrypted.toString("utf8");
    } catch (error) {
        console.error("Decryption error:", error);
        throw new Error("Failed to decrypt value");
    }
}

/**
 * Encrypt environment variables object
 * @param envVars - Array of environment variables
 * @returns Array with encrypted secret values
 */
export function encryptEnvVars(
    envVars: Array<{ id: string; key: string; value: string; isSecret: boolean }>
): Array<{ id: string; key: string; value: string; isSecret: boolean }> {
    return envVars.map((envVar) => ({
        ...envVar,
        value: envVar.isSecret ? encryptValue(envVar.value) : envVar.value,
    }));
}

/**
 * Decrypt environment variables object
 * @param envVars - Array of environment variables with encrypted secret values
 * @returns Array with decrypted values
 */
export function decryptEnvVars(
    envVars: Array<{ id: string; key: string; value: string; isSecret: boolean }>
): Array<{ id: string; key: string; value: string; isSecret: boolean }> {
    return envVars.map((envVar) => {
        try {
            return {
                ...envVar,
                value: envVar.isSecret ? decryptValue(envVar.value) : envVar.value,
            };
        } catch {
            // If decryption fails, return original (might be unencrypted legacy data)
            return envVar;
        }
    });
}

/**
 * Validate environment variable name format
 * @param key - Environment variable name
 * @returns true if valid, false otherwise
 */
export function validateEnvVarName(key: string): boolean {
    // Valid env var names: uppercase letters, numbers, underscores
    // Must start with a letter
    const regex = /^[A-Z][A-Z0-9_]*$/;
    return regex.test(key);
}

/**
 * Validate environment variable value
 * @param value - Environment variable value
 * @param type - Optional type to validate against (url, email, number, etc.)
 * @returns { valid: boolean, error?: string }
 */
export function validateEnvVarValue(
    value: string,
    type?: "url" | "email" | "number" | "port" | "json" | "boolean"
): { valid: boolean; error?: string } {
    if (!value || value.trim() === "") {
        return { valid: false, error: "Value cannot be empty" };
    }

    if (type === "url") {
        try {
            new URL(value);
            return { valid: true };
        } catch {
            return { valid: false, error: "Invalid URL format" };
        }
    }

    if (type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return { valid: false, error: "Invalid email format" };
        }
    }

    if (type === "number") {
        if (isNaN(Number(value))) {
            return { valid: false, error: "Value must be a number" };
        }
    }

    if (type === "port") {
        const port = Number(value);
        if (isNaN(port) || port < 1 || port > 65535) {
            return { valid: false, error: "Invalid port number (1-65535)" };
        }
    }

    if (type === "json") {
        try {
            JSON.parse(value);
            return { valid: true };
        } catch {
            return { valid: false, error: "Invalid JSON format" };
        }
    }

    if (type === "boolean") {
        const normalized = value.toLowerCase();
        if (!["true", "false", "1", "0", "yes", "no"].includes(normalized)) {
            return { valid: false, error: "Invalid boolean value" };
        }
    }

    return { valid: true };
}

/**
 * Mask a secret value for display
 * @param value - Value to mask
 * @param visibleChars - Number of characters to show at the end
 * @returns Masked string
 */
export function maskSecretValue(value: string, visibleChars: number = 4): string {
    if (value.length <= visibleChars) {
        return "•".repeat(8);
    }
    const visible = value.slice(-visibleChars);
    return "•".repeat(8) + visible;
}

/**
 * Generate a secure random token for webhook secrets, API keys, etc.
 * @param length - Length of the token (default 32)
 * @returns Random token string
 */
export function generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString("hex");
}

/**
 * Hash a value using SHA-256 for comparison without storing the original
 * @param value - Value to hash
 * @returns Hashed value
 */
export function hashValue(value: string): string {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Check if a value is encrypted
 * @param value - Value to check
 * @returns true if encrypted format is detected
 */
export function isEncrypted(value: string): boolean {
    const parts = value.split(":");
    return parts.length === 2 && /^[0-9a-f]+$/.test(parts[0]) && /^[0-9a-f]+$/.test(parts[1]);
}

/**
 * Sanitize environment variable value for logging (never log secrets)
 * @param value - Value to sanitize
 * @param isSecret - Whether this is a secret value
 * @returns Sanitized string safe for logs
 */
export function sanitizeForLog(value: string, isSecret: boolean): string {
    if (isSecret) {
        return "[REDACTED]";
    }
    // Even for non-secrets, truncate very long values
    if (value.length > 100) {
        return value.slice(0, 100) + "... (truncated)";
    }
    return value;
}
