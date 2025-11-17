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
    type?: "url" | "email" | "number" | "port"
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

    return { valid: true };
}
