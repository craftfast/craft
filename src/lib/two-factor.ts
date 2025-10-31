/**
 * Two-Factor Authentication (2FA) Utilities
 * 
 * Provides TOTP (Time-based One-Time Password) generation and verification
 * using the OATH standard. Compatible with Google Authenticator, Authy, etc.
 */

import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const APP_NAME = "Craft";

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret(): string {
    // Generate a random secret using OTPAuth
    const secret = new OTPAuth.Secret({ size: 20 });
    return secret.base32;
}

/**
 * Generate a TOTP instance for a user
 */
export function createTOTP(secret: string, email: string): OTPAuth.TOTP {
    return new OTPAuth.TOTP({
        issuer: APP_NAME,
        label: email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
    });
}

/**
 * Generate a QR code data URL for a TOTP secret
 */
export async function generateQRCode(secret: string, email: string): Promise<string> {
    const totp = createTOTP(secret, email);
    const otpauthUrl = totp.toString();

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
}

/**
 * Verify a TOTP code against a secret
 * Allows for a time window of ±1 period (90 seconds total) to account for clock drift
 */
export function verifyTOTP(secret: string, token: string, email: string): boolean {
    try {
        const totp = createTOTP(secret, email);

        // Verify with a window of ±1 period (30 seconds before and after)
        const delta = totp.validate({
            token,
            window: 1,
        });

        // delta is the time step difference, null means invalid
        return delta !== null;
    } catch (error) {
        console.error("TOTP verification error:", error);
        return false;
    }
}

/**
 * Generate backup codes for account recovery
 * Returns an array of 10 codes, each 8 characters long
 */
export function generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
        // Generate 8 random characters (alphanumeric)
        const code = randomBytes(4)
            .toString("hex")
            .toUpperCase()
            .match(/.{1,4}/g)
            ?.join("-") || "";
        codes.push(code);
    }

    return codes;
}

/**
 * Hash backup codes for secure storage
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
    const hashedCodes = await Promise.all(
        codes.map((code) => bcrypt.hash(code, 10))
    );
    return hashedCodes;
}

/**
 * Verify a backup code against hashed codes
 * Returns the index of the matched code, or -1 if no match
 */
export async function verifyBackupCode(
    code: string,
    hashedCodes: string[]
): Promise<number> {
    for (let i = 0; i < hashedCodes.length; i++) {
        const isValid = await bcrypt.compare(code, hashedCodes[i]);
        if (isValid) {
            return i;
        }
    }
    return -1;
}

/**
 * Format backup codes for display to user
 */
export function formatBackupCodes(codes: string[]): string {
    return codes
        .map((code, index) => `${(index + 1).toString().padStart(2, "0")}. ${code}`)
        .join("\n");
}
