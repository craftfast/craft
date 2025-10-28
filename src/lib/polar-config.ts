/**
 * Polar Configuration
 * Maps subscription tiers to Polar PRODUCT IDs (not price IDs)
 * 
 * Why Product IDs instead of Price IDs?
 * - A product can have multiple prices (different currencies, regions, etc.)
 * - Product IDs are stable even when prices change
 * - Simpler configuration - one ID per product type
 */

export const POLAR_CONFIG = {
    server: process.env.POLAR_SERVER || 'sandbox',
    accessToken: process.env.POLAR_ACCESS_TOKEN || '',
    organizationId: process.env.POLAR_ORGANIZATION_ID || '',
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET || '',

    // Subscription product IDs
    subscriptions: {
        pro: process.env.POLAR_PRO_PRODUCT_ID || '',
    },
} as const;

/**
 * Validate Polar configuration
 */
export function validatePolarConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!POLAR_CONFIG.accessToken) {
        errors.push('POLAR_ACCESS_TOKEN is not set');
    }

    if (!POLAR_CONFIG.organizationId) {
        errors.push('POLAR_ORGANIZATION_ID is not set');
    }

    if (!POLAR_CONFIG.webhookSecret) {
        errors.push('POLAR_WEBHOOK_SECRET is not set');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
