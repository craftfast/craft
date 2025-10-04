/**
 * Razorpay Integration Utility
 * Handles payment processing for Premium plan subscriptions
 */

interface RazorpayInstance {
    open: () => void;
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface RazorpayConstructor {
    new(options: RazorpayConfig): RazorpayInstance;
}

interface RazorpayConfig {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: {
        email?: string;
        contact?: string;
    };
    theme?: {
        color?: string;
    };
    handler: (response: RazorpayResponse) => void;
    modal?: {
        ondismiss?: () => void;
    };
}

declare global {
    interface Window {
        Razorpay: RazorpayConstructor;
    }
}

export interface RazorpayOptions {
    amount: number; // Amount in smallest currency unit (e.g., paise for INR, cents for USD)
    currency: string; // "INR" or "USD"
    name: string;
    description: string;
    planName: string;
    email?: string;
    contact?: string;
    onSuccess: (response: RazorpayResponse) => void;
    onFailure: (error: Error | { error: string }) => void;
}

/**
 * Load Razorpay script dynamically
 */
export function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window !== "undefined" && window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

/**
 * Initialize Razorpay payment
 */
export async function initiateRazorpayPayment(options: RazorpayOptions) {
    // Load Razorpay script
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
        options.onFailure({ error: "Failed to load Razorpay SDK" });
        return;
    }

    // Create order on backend (you'll need to implement this API endpoint)
    try {
        const response = await fetch("/api/payment/create-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: options.amount,
                currency: options.currency,
                plan: options.planName,
            }),
        });

        const order = await response.json();

        if (!order.orderId) {
            throw new Error("Failed to create order");
        }

        const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKeyId) {
            throw new Error("Razorpay Key ID not configured");
        }

        // Razorpay configuration
        const razorpayOptions: RazorpayConfig = {
            key: razorpayKeyId,
            amount: options.amount,
            currency: options.currency,
            name: options.name,
            description: options.description,
            order_id: order.orderId,
            prefill: {
                email: options.email,
                contact: options.contact,
            },
            theme: {
                color: "#171717", // neutral-900 for brand consistency
            },
            handler: function (response: RazorpayResponse) {
                // Payment successful
                options.onSuccess(response);
            },
            modal: {
                ondismiss: function () {
                    options.onFailure({ error: "Payment cancelled by user" });
                },
            },
        };

        const razorpay = new window.Razorpay(razorpayOptions);
        razorpay.open();
    } catch (error) {
        options.onFailure(error as Error);
    }
}

/**
 * Verify payment signature on backend
 */
export async function verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
) {
    try {
        const response = await fetch("/api/payment/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                orderId,
                paymentId,
                signature,
            }),
        });

        const result = await response.json();
        return result.verified;
    } catch (error) {
        console.error("Payment verification failed:", error);
        return false;
    }
}

/**
 * Helper function to convert plan price to smallest currency unit
 */
export function convertToSmallestUnit(amount: number): number {
    // For INR and USD, multiply by 100 to convert to paise/cents
    return Math.round(amount * 100);
}

/**
 * Get plan pricing based on currency
 */
export function getPlanPrice(planName: string, currency: "INR" | "USD"): number {
    const pricing: Record<string, Record<string, number>> = {
        Premium: {
            USD: 500,
            INR: 41500,
        },
    };

    return pricing[planName]?.[currency] || 0;
}
