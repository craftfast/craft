/**
 * Secure Error Handling Utilities
 * Issue 17: Enhanced Error Messages
 * 
 * Provides utilities to sanitize error messages in production while
 * maintaining detailed error information for debugging in development.
 */

/**
 * Determines if we're running in production mode
 */
export const isProduction = (): boolean => {
    return process.env.NODE_ENV === "production";
};

/**
 * Generic error messages for production
 * These don't leak any sensitive information about the system
 */
export const GENERIC_ERRORS = {
    INTERNAL_SERVER_ERROR: "An unexpected error occurred. Please try again later.",
    AUTHENTICATION_FAILED: "Authentication failed. Please check your credentials and try again.",
    UNAUTHORIZED: "You must be signed in to access this resource.",
    FORBIDDEN: "You don't have permission to access this resource.",
    NOT_FOUND: "The requested resource was not found.",
    VALIDATION_ERROR: "Invalid request. Please check your input and try again.",
    RATE_LIMIT: "Too many requests. Please try again later.",
} as const;

/**
 * Maps specific error messages to generic ones for production
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
    // Authentication errors
    "Invalid credentials": GENERIC_ERRORS.AUTHENTICATION_FAILED,
    "Invalid password": GENERIC_ERRORS.AUTHENTICATION_FAILED,
    "User not found": GENERIC_ERRORS.AUTHENTICATION_FAILED,
    "Email not found": GENERIC_ERRORS.AUTHENTICATION_FAILED,
    "Password is incorrect": GENERIC_ERRORS.AUTHENTICATION_FAILED,

    // Database errors
    "Database connection failed": GENERIC_ERRORS.INTERNAL_SERVER_ERROR,
    "Query failed": GENERIC_ERRORS.INTERNAL_SERVER_ERROR,
    "Transaction failed": GENERIC_ERRORS.INTERNAL_SERVER_ERROR,

    // Email errors
    "Failed to send email": GENERIC_ERRORS.INTERNAL_SERVER_ERROR,
    "Email service unavailable": GENERIC_ERRORS.INTERNAL_SERVER_ERROR,
};

/**
 * Sanitizes error messages for production
 * 
 * @param error - The error message or Error object
 * @param fallbackMessage - Optional fallback generic message
 * @returns Sanitized error message safe for production
 * 
 * @example
 * ```typescript
 * // In development: "User not found in database"
 * // In production: "Authentication failed. Please check your credentials and try again."
 * const message = sanitizeError("User not found in database");
 * ```
 */
export function sanitizeError(
    error: string | Error | unknown,
    fallbackMessage: string = GENERIC_ERRORS.INTERNAL_SERVER_ERROR
): string {
    // In development, return the actual error message
    if (!isProduction()) {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === "string") {
            return error;
        }
        return fallbackMessage;
    }

    // In production, sanitize the error message
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if we have a mapped generic message for this specific error
    const genericMessage = ERROR_MESSAGE_MAP[errorMessage];
    if (genericMessage) {
        return genericMessage;
    }

    // Return the fallback generic message
    return fallbackMessage;
}

/**
 * Logs error details server-side while returning safe message to client
 * 
 * @param error - The error to log
 * @param context - Additional context about where the error occurred
 * @param userFacingMessage - Optional custom message to return to user
 * @returns Object with sanitized message and flag indicating if it's a generic message
 * 
 * @example
 * ```typescript
 * const { message, isGeneric } = logAndSanitizeError(
 *   error,
 *   "User registration",
 *   GENERIC_ERRORS.INTERNAL_SERVER_ERROR
 * );
 * 
 * return NextResponse.json({ error: message }, { status: 500 });
 * ```
 */
export function logAndSanitizeError(
    error: unknown,
    context: string,
    userFacingMessage?: string
): { message: string; isGeneric: boolean } {
    // Always log the full error details server-side
    console.error(`[${context}] Error:`, error);

    // If a stack trace is available, log it in development
    if (!isProduction() && error instanceof Error && error.stack) {
        console.error(`[${context}] Stack trace:`, error.stack);
    }

    const sanitizedMessage = userFacingMessage || sanitizeError(error);
    const isGeneric = isProduction();

    return {
        message: sanitizedMessage,
        isGeneric,
    };
}

/**
 * Safe error response builder for API routes
 * 
 * @param error - The error that occurred
 * @param context - Context about where the error occurred (for logging)
 * @param statusCode - HTTP status code
 * @param userMessage - Optional specific user-facing message
 * @returns Object with error message and metadata
 * 
 * @example
 * ```typescript
 * const errorResponse = buildErrorResponse(
 *   error,
 *   "Email verification",
 *   500,
 *   "Failed to verify email"
 * );
 * 
 * return NextResponse.json(errorResponse, { status: 500 });
 * ```
 */
export function buildErrorResponse(
    error: unknown,
    context: string,
    statusCode: number = 500,
    userMessage?: string
): {
    error: string;
    statusCode: number;
    timestamp: string;
} {
    const { message } = logAndSanitizeError(error, context, userMessage);

    return {
        error: message,
        statusCode,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Type guard to check if an error is safe to expose to users
 * Certain validation errors and user-facing errors are safe to show
 * 
 * @param error - The error to check
 * @returns true if the error is safe to show to users
 */
export function isSafeUserError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    const message = error.message.toLowerCase();

    // These patterns indicate user-facing validation errors that are safe to show
    const safePatterns = [
        "required",
        "must be",
        "invalid format",
        "too short",
        "too long",
        "must contain",
        "cannot be empty",
    ];

    return safePatterns.some(pattern => message.includes(pattern));
}

/**
 * Determines appropriate error message based on error type and environment
 * Allows safe validation errors through while sanitizing others
 * 
 * @param error - The error object or message
 * @param genericMessage - Fallback generic message
 * @returns Safe error message for client response
 */
export function getClientSafeErrorMessage(
    error: unknown,
    genericMessage: string = GENERIC_ERRORS.INTERNAL_SERVER_ERROR
): string {
    // User-facing validation errors are always safe to show
    if (isSafeUserError(error)) {
        return error instanceof Error ? error.message : String(error);
    }

    // All other errors get sanitized
    return sanitizeError(error, genericMessage);
}
