/**
 * Password validation utilities
 * 
 * Strong password requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */

export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}

export const PASSWORD_REQUIREMENTS = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
};

/**
 * Validates password against strong security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (!password) {
        errors.push("Password is required");
        return { isValid: false, errors };
    }

    // Check minimum length
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(
            `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`
        );
    }

    // Check for uppercase letter
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }

    // Check for lowercase letter
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }

    // Check for number
    if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }

    // Check for special character
    if (
        PASSWORD_REQUIREMENTS.requireSpecial &&
        !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
    ) {
        errors.push(
            "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Get a user-friendly description of password requirements
 */
export function getPasswordRequirementsText(): string {
    return `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters and include uppercase, lowercase, number, and special character.`;
}

/**
 * Get detailed password requirements for display
 */
export function getPasswordRequirementsList(): string[] {
    return [
        `At least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
        "One uppercase letter (A-Z)",
        "One lowercase letter (a-z)",
        "One number (0-9)",
        "One special character (!@#$%^&*()_+-=[]{}|;:,.<>?)",
    ];
}
