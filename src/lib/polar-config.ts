/**
 * Polar Configuration for Token Purchases
 * Maps token amounts to Polar price IDs for checkout
 */

export const POLAR_CONFIG = {
    server: process.env.POLAR_SERVER || 'sandbox',
    accessToken: process.env.POLAR_ACCESS_TOKEN || '',
    organizationId: process.env.POLAR_ORGANIZATION_ID || '',
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET || '',

    // Subscription price IDs
    subscriptions: {
        pro: process.env.POLAR_PRO_PRICE_ID || '',
    },

    // Token purchase price IDs (one-time purchases)
    // These should be created in Polar Dashboard as one-time products
    tokenPurchases: {
        '1000000': process.env.POLAR_TOKEN_1M_PRICE_ID || '', // 1M tokens - $5
        '5000000': process.env.POLAR_TOKEN_5M_PRICE_ID || '', // 5M tokens - $22
        '10000000': process.env.POLAR_TOKEN_10M_PRICE_ID || '', // 10M tokens - $42
        '25000000': process.env.POLAR_TOKEN_25M_PRICE_ID || '', // 25M tokens - $100
        '50000000': process.env.POLAR_TOKEN_50M_PRICE_ID || '', // 50M tokens - $187
        '100000000': process.env.POLAR_TOKEN_100M_PRICE_ID || '', // 100M tokens - $350
        '250000000': process.env.POLAR_TOKEN_250M_PRICE_ID || '', // 250M tokens - $812
        '500000000': process.env.POLAR_TOKEN_500M_PRICE_ID || '', // 500M tokens - $1,500
        '1000000000': process.env.POLAR_TOKEN_1000M_PRICE_ID || '', // 1000M tokens - $2,750
    },
} as const;

/**
 * Get Polar price ID for a token amount
 */
export function getTokenPurchasePriceId(tokenAmount: number): string | null {
    const priceId = POLAR_CONFIG.tokenPurchases[tokenAmount.toString() as keyof typeof POLAR_CONFIG.tokenPurchases];
    return priceId || null;
}

/**
 * Get token amount from Polar price ID
 */
export function getTokenAmountFromPriceId(priceId: string): number | null {
    const entry = Object.entries(POLAR_CONFIG.tokenPurchases).find(([, id]) => id === priceId);
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

    // Check if at least one token purchase price ID is configured
    const hasTokenPrices = Object.values(POLAR_CONFIG.tokenPurchases).some(id => id !== '');
    if (!hasTokenPrices) {
        errors.push('No token purchase price IDs configured (POLAR_TOKEN_*_PRICE_ID)');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
