/**
 * Razorpay Webhook Types
 * 
 * TypeScript types for Razorpay webhook events.
 * Reference: https://razorpay.com/docs/webhooks/
 */

export interface RazorpayWebhookEvent {
    entity: string; // "event"
    account_id: string;
    event: string; // e.g., "payment.captured", "order.paid"
    contains: string[]; // e.g., ["payment"]
    payload: {
        payment?: {
            entity: RazorpayPayment;
        };
        order?: {
            entity: RazorpayOrder;
        };
    };
    created_at: number; // Unix timestamp
}

export interface RazorpayPayment {
    id: string;
    entity: string; // "payment"
    amount: number; // In paise
    currency: string;
    status: "created" | "authorized" | "captured" | "refunded" | "failed";
    order_id: string;
    invoice_id: string | null;
    international: boolean;
    method: string; // "card", "netbanking", "wallet", "upi", etc.
    amount_refunded: number;
    refund_status: string | null;
    captured: boolean;
    description: string;
    card_id: string | null;
    bank: string | null;
    wallet: string | null;
    vpa: string | null;
    email: string;
    contact: string;
    notes: Record<string, string>;
    fee: number;
    tax: number;
    error_code: string | null;
    error_description: string | null;
    error_source: string | null;
    error_step: string | null;
    error_reason: string | null;
    acquirer_data: Record<string, any>;
    created_at: number;
}

export interface RazorpayOrder {
    id: string;
    entity: string; // "order"
    amount: number; // In paise
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    offer_id: string | null;
    status: "created" | "attempted" | "paid";
    attempts: number;
    notes: Record<string, string>;
    created_at: number;
}

export interface RazorpaySubscription {
    id: string;
    entity: string; // "subscription"
    plan_id: string;
    customer_id: string;
    status: "created" | "authenticated" | "active" | "pending" | "halted" | "cancelled" | "completed" | "expired";
    current_start: number;
    current_end: number;
    ended_at: number | null;
    quantity: number;
    notes: Record<string, string>;
    charge_at: number;
    start_at: number;
    end_at: number;
    auth_attempts: number;
    total_count: number;
    paid_count: number;
    customer_notify: number;
    created_at: number;
    expire_by: number;
    short_url: string;
    has_scheduled_changes: boolean;
    change_scheduled_at: number | null;
    source: string;
    payment_method: string;
}

// Webhook event type helpers
export type PaymentCapturedEvent = RazorpayWebhookEvent & {
    event: "payment.captured";
    payload: {
        payment: {
            entity: RazorpayPayment;
        };
    };
};

export type PaymentFailedEvent = RazorpayWebhookEvent & {
    event: "payment.failed";
    payload: {
        payment: {
            entity: RazorpayPayment;
        };
    };
};

export type OrderPaidEvent = RazorpayWebhookEvent & {
    event: "order.paid";
    payload: {
        order: {
            entity: RazorpayOrder;
        };
        payment: {
            entity: RazorpayPayment;
        };
    };
};

export type SubscriptionChargedEvent = RazorpayWebhookEvent & {
    event: "subscription.charged";
    payload: {
        subscription: {
            entity: RazorpaySubscription;
        };
        payment: {
            entity: RazorpayPayment;
        };
    };
};

export type SubscriptionCancelledEvent = RazorpayWebhookEvent & {
    event: "subscription.cancelled";
    payload: {
        subscription: {
            entity: RazorpaySubscription;
        };
    };
};
