/**
 * Zod Validation Schemas for Authentication Endpoints
 * 
 * Comprehensive input validation for all auth endpoints to prevent:
 * - SQL injection
 * - XSS attacks
 * - Invalid data formats
 * - Weak passwords
 */

import { z } from "zod";
import { PASSWORD_REQUIREMENTS } from "@/lib/password-validation";

/**
 * Email validation schema
 * - Valid email format
 * - Reasonable length limits
 * - Normalized to lowercase
 */
export const emailSchema = z
    .string()
    .email("Invalid email address")
    .min(3, "Email must be at least 3 characters")
    .max(255, "Email must be less than 255 characters")
    .transform((email) => email.toLowerCase().trim());

/**
 * Password validation schema for sign-in
 * - Basic format validation only (actual password check is done by auth system)
 */
export const passwordSchema = z
    .string()
    .min(1, "Password is required")
    .max(255, "Password is too long");

/**
 * Strong password validation schema for sign-up and password reset
 * - Minimum 12 characters
 * - Contains uppercase, lowercase, number, and special character
 */
export const strongPasswordSchema = z
    .string()
    .min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
    .max(255, "Password is too long")
    .refine(
        (password) => PASSWORD_REQUIREMENTS.requireUppercase ? /[A-Z]/.test(password) : true,
        "Password must contain at least one uppercase letter"
    )
    .refine(
        (password) => PASSWORD_REQUIREMENTS.requireLowercase ? /[a-z]/.test(password) : true,
        "Password must contain at least one lowercase letter"
    )
    .refine(
        (password) => PASSWORD_REQUIREMENTS.requireNumber ? /[0-9]/.test(password) : true,
        "Password must contain at least one number"
    )
    .refine(
        (password) => PASSWORD_REQUIREMENTS.requireSpecial ? /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) : true,
        "Password must contain at least one special character"
    );

/**
 * Name validation schema
 * - Reasonable length limits
 * - Trimmed whitespace
 */
export const nameSchema = z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .transform((name) => name.trim());

/**
 * Token validation schema
 * - Valid format for reset tokens, verification tokens, etc.
 */
export const tokenSchema = z
    .string()
    .min(10, "Invalid token format")
    .max(500, "Invalid token format");

/**
 * Sign-in validation schema
 */
export const signInSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    callbackURL: z.string().url().optional(),
});

/**
 * Sign-up validation schema
 */
export const signUpSchema = z.object({
    name: nameSchema.optional(),
    email: emailSchema,
    password: strongPasswordSchema,
    callbackURL: z.string().url().optional(),
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
    email: emailSchema,
    callbackURL: z.string().url().optional(),
});

/**
 * Password reset confirmation schema
 */
export const passwordResetSchema = z.object({
    token: tokenSchema,
    password: strongPasswordSchema,
});

/**
 * Password change schema (for authenticated users)
 */
export const passwordChangeSchema = z.object({
    currentPassword: passwordSchema,
    newPassword: strongPasswordSchema,
}).refine(
    (data) => data.currentPassword !== data.newPassword,
    {
        message: "New password must be different from current password",
        path: ["newPassword"],
    }
);

/**
 * Email verification schema
 */
export const emailVerificationSchema = z.object({
    token: tokenSchema,
});

/**
 * Account linking schema
 */
export const accountLinkingSchema = z.object({
    provider: z.enum(["google", "github", "email"]),
    token: tokenSchema.optional(),
});

/**
 * Type exports for use in API routes
 */
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type AccountLinkingInput = z.infer<typeof accountLinkingSchema>;

/**
 * Validate request body against schema
 * Returns validated data or throws error with user-friendly messages
 */
export function validateAuthInput<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.issues.map((err) => {
                const field = err.path.join(".");
                return `${field ? field + ": " : ""}${err.message}`;
            });
            return { success: false, errors };
        }
        return { success: false, errors: ["Validation failed"] };
    }
}
