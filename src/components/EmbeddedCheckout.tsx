"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface EmbeddedCheckoutProps {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  userEmail?: string;
  userName?: string;
  description?: string;
  onSuccess?: () => void;
  onClose?: () => void;
  theme?: "light" | "dark";
}

/**
 * EmbeddedCheckout Component
 *
 * Integrates Razorpay checkout directly in the app.
 * Razorpay provides a modal overlay for payment collection.
 *
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 */
export default function EmbeddedCheckout({
  orderId,
  amount,
  currency,
  keyId,
  userEmail,
  userName,
  description = "Balance Top-Up",
  onSuccess,
  onClose,
  theme = "light",
}: EmbeddedCheckoutProps) {
  const isInitializingRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);
  const razorpayInstanceRef = useRef<any>(null);

  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onCloseRef.current = onClose;
  }, [onSuccess, onClose]);

  // Load Razorpay SDK and initialize checkout
  useEffect(() => {
    // Prevent duplicate initialization
    if (isInitializingRef.current) {
      console.log("⚠️ Checkout already initializing, skipping");
      return;
    }

    isInitializingRef.current = true;

    // Load Razorpay SDK if not already loaded
    const loadRazorpaySDK = () => {
      if (window.Razorpay) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => {
          console.log("✅ Razorpay SDK loaded");
          resolve();
        };
        script.onerror = () => {
          console.error("❌ Failed to load Razorpay SDK");
          reject(new Error("Failed to load Razorpay SDK"));
        };
        document.body.appendChild(script);
      });
    };

    console.log("🚀 Initializing Razorpay checkout...");
    console.log("Order ID:", orderId);
    console.log("Amount:", amount, currency);

    loadRazorpaySDK()
      .then(() => {
        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          order_id: orderId,
          name: "Craft",
          description: description,
          image: "/logo.png",
          prefill: {
            email: userEmail,
            name: userName,
          },
          theme: {
            color: theme === "dark" ? "#000000" : "#3399cc",
          },
          handler: function (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) {
            console.log("💰 Payment successful", response);
            toast.success("Payment successful! Your balance has been updated.");

            // Dispatch credit update event
            const event = new CustomEvent("credits-updated");
            window.dispatchEvent(event);

            onSuccessRef.current?.();

            // Close after success
            setTimeout(() => {
              onCloseRef.current?.();
            }, 1500);
          },
          modal: {
            ondismiss: function () {
              console.log("❌ Checkout dismissed");
              isInitializingRef.current = false;
              onCloseRef.current?.();
            },
          },
        };

        const rzp = new window.Razorpay(options);
        razorpayInstanceRef.current = rzp;

        rzp.on("payment.failed", function (response: any) {
          console.error("❌ Payment failed", response.error);
          toast.error("Payment failed. Please try again.");
          onCloseRef.current?.();
        });

        // Open the checkout
        rzp.open();
        console.log("✅ Razorpay checkout opened");
      })
      .catch((error) => {
        console.error("❌ Failed to initialize checkout:", error);
        toast.error("Failed to load checkout. Please try again.");
        isInitializingRef.current = false;
        onCloseRef.current?.();
      });

    // Cleanup on unmount
    return () => {
      console.log("🧹 Component unmounting");
      if (razorpayInstanceRef.current) {
        try {
          // Razorpay doesn't have a close method, modal auto-closes
          razorpayInstanceRef.current = null;
        } catch (e) {
          console.error("Error cleaning up checkout:", e);
        }
      }
      isInitializingRef.current = false;
    };
  }, [
    orderId,
    amount,
    currency,
    keyId,
    userEmail,
    userName,
    description,
    theme,
  ]);

  // Razorpay manages its own rendering
  return null;
}
