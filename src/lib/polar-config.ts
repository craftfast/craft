/**
 * Polar Configuration for Token Purchases
 * Maps token amounts to Polar PRODUCT IDs (not price IDs)
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

    // Token purchase product IDs (one-time purchases)
    // These are the PRODUCT IDs from Polar Dashboard, not the price IDs
    tokenPurchases: {
        '1000000': process.env.POLAR_TOKEN_1M_PRODUCT_ID || '', // 1M tokens - $5
        '5000000': process.env.POLAR_TOKEN_5M_PRODUCT_ID || '', // 5M tokens - $22
        '10000000': process.env.POLAR_TOKEN_10M_PRODUCT_ID || '', // 10M tokens - $42
        '25000000': process.env.POLAR_TOKEN_25M_PRODUCT_ID || '', // 25M tokens - $100
        '50000000': process.env.POLAR_TOKEN_50M_PRODUCT_ID || '', // 50M tokens - $187
        '100000000': process.env.POLAR_TOKEN_100M_PRODUCT_ID || '', // 100M tokens - $350
        '250000000': process.env.POLAR_TOKEN_250M_PRODUCT_ID || '', // 250M tokens - $812
        '500000000': process.env.POLAR_TOKEN_500M_PRODUCT_ID || '', // 500M tokens - $1,500
        '1000000000': process.env.POLAR_TOKEN_1000M_PRODUCT_ID || '', // 1000M tokens - $2,750
    },
} as const;

/**
 * Get Polar product ID for a token amount
 */
export function getTokenPurchaseProductId(tokenAmount: number): string | null {
    const productId = POLAR_CONFIG.tokenPurchases[tokenAmount.toString() as keyof typeof POLAR_CONFIG.tokenPurchases];
    return productId || null;
}

/**
 * Get token amount from Polar product ID
 */
export function getTokenAmountFromProductId(productId: string): number | null {
    const entry = Object.entries(POLAR_CONFIG.tokenPurchases).find(([, id]) => id === productId);
    return entry ? parseInt(entry[0]) : null;
}

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

    // Check if at least one token purchase product ID is configured
    const hasTokenProducts = Object.values(POLAR_CONFIG.tokenPurchases).some(id => id !== '');
    if (!hasTokenProducts) {
        errors.push('No token purchase product IDs configured (POLAR_TOKEN_*_PRODUCT_ID)');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
