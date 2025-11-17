/**
 * TypeScript types for Polar webhook events
 * 
 * These types are based on Polar's webhook payload structure.
 * Reference: https://docs.polar.sh/api/webhooks
 */

export interface BenefitGrant {
    id: string;
    customer_id: string;
    benefit_id: string;
    subscription_id?: string;
    order_id?: string;
    granted_at: string;
    revoked_at?: string;
    properties?: Record<string, unknown>;
}

export interface CheckoutEvent {
    id: string;
    customer_id: string;
    product_id: string;
    product_price_id: string;
    amount: number;
    tax_amount?: number;
    currency: string;
    status: string;
    created_at: string;
    updated_at: string;
    customer_email?: string;
    customer_name?: string;
    customer?: {
        id: string;
        email: string;
        external_id?: string;
    };
    success_url?: string;
    subscription_id?: string;
    metadata?: Record<string, unknown>;
}

export interface CustomerEvent {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    external_id?: string;
    created_at: string;
    updated_at: string;
    metadata?: Record<string, unknown>;
}

export interface OrderEvent {
    id: string;
    customer_id: string;
    product_id: string;
    product_price_id: string;
    amount: number;
    tax_amount?: number;
    currency: string;
    billing_reason?: string;
    created_at: string;
    user_id?: string;
    subscription_id?: string;
    checkout_id?: string;
    customer?: {
        id: string;
        email: string;
        external_id?: string;
    };
}

export interface SubscriptionEvent {
    id: string;
    customer_id: string;
    product_id: string;
    product_price_id: string;
    status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    started_at?: string;
    ended_at?: string;
    trial_start?: string;
    trial_end?: string;
    metadata?: Record<string, unknown>;
    customer?: {
        id: string;
        email: string;
        external_id?: string;
    };
    product?: {
        id: string;
        name: string;
    };
    price?: {
        id: string;
        amount: number;
        currency: string;
    };
}

export interface WebhookPayload {
    id: string;
    created_at: string;
    type: string;
    data: BenefitGrant | CheckoutEvent | CustomerEvent | OrderEvent | SubscriptionEvent | Record<string, unknown>;
}
