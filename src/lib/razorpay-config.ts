/**
 * Razorpay Configuration
 * 
 * Central configuration for Razorpay payment gateway integration.
 */

// Dynamic config getter to ensure environment variables are read at runtime
function getConfig() {
    return {
        keyId: process.env.RAZORPAY_KEY_ID || '',
        keySecret: process.env.RAZORPAY_KEY_SECRET || '',
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
        currency: process.env.RAZORPAY_CURRENCY || 'USD',
    };
}

// Export as getter for use in other files
export const RAZORPAY_CONFIG = getConfig();

/**
 * Validate Razorpay configuration
 */
export function validateRazorpayConfig(): { valid: boolean; errors: string[] } {
    const config = getConfig();
    const errors: string[] = [];

    if (!config.keyId) {
        errors.push('RAZORPAY_KEY_ID is not set');
    }

    if (!config.keySecret) {
        errors.push('RAZORPAY_KEY_SECRET is not set');
    }

    if (!config.webhookSecret) {
        errors.push('RAZORPAY_WEBHOOK_SECRET is not set');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get Razorpay configuration status
 */
export function getRazorpayConfigStatus() {
    const config = getConfig();
    const validation = validateRazorpayConfig();

    return {
        configured: validation.valid,
        keyId: config.keyId ? '✓ Set' : '✗ Missing',
        keySecret: config.keySecret ? '✓ Set' : '✗ Missing',
        webhookSecret: config.webhookSecret ? '✓ Set' : '✗ Missing',
        currency: config.currency,
        errors: validation.errors,
    };
}
