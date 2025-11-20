/**
 * Razorpay Checkout Hook
 * 
 * React hook for handling Razorpay payment integration.
 * This loads the Razorpay SDK and provides a function to open the checkout.
 */

import { useEffect, useState } from 'react';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description?: string;
    image?: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme?: {
        color?: string;
    };
    handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }) => void;
    modal?: {
        ondismiss?: () => void;
    };
}

export function useRazorpay() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check if Razorpay is already loaded
        if (window.Razorpay) {
            setIsLoaded(true);
            return;
        }

        // Load Razorpay SDK
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
            setIsLoaded(true);
        };
        script.onerror = () => {
            console.error('Failed to load Razorpay SDK');
        };

        document.body.appendChild(script);

        return () => {
            // Cleanup
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    const openCheckout = (options: RazorpayOptions) => {
        if (!isLoaded || !window.Razorpay) {
            console.error('Razorpay SDK not loaded');
            return;
        }

        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    return {
        isLoaded,
        openCheckout,
    };
}
