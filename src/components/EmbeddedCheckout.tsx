"use client";

import { useEffect, useRef, useState } from "react";
import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import { toast } from "sonner";

interface EmbeddedCheckoutProps {
  checkoutUrl: string;
  onSuccess?: () => void;
  onClose?: () => void;
  theme?: "light" | "dark";
}

/**
 * EmbeddedCheckout Component
 *
 * Integrates Polar checkout directly in the app without redirects.
 * Users can upgrade their plan seamlessly without leaving their current context.
 *
 * @see https://polar.sh/docs/features/checkout/embed
 */
export default function EmbeddedCheckout({
  checkoutUrl,
  onSuccess,
  onClose,
  theme = "light",
}: EmbeddedCheckoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const checkoutInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!checkoutUrl) return;

    const initCheckout = async () => {
      try {
        setIsLoading(true);

        // Create embedded checkout instance
        const checkout = await PolarEmbedCheckout.create(checkoutUrl, theme);
        checkoutInstanceRef.current = checkout;

        // Listen for checkout loaded
        checkout.addEventListener("loaded", () => {
          setIsLoading(false);
        });

        // Listen for checkout close
        checkout.addEventListener("close", () => {
          onClose?.();
        });

        // Listen for checkout confirmed (payment processing)
        checkout.addEventListener("confirmed", () => {
          toast.loading("Processing payment...");
        });

        // Listen for successful completion
        checkout.addEventListener("success", (event) => {
          toast.dismiss();
          toast.success("Payment successful! Your plan has been upgraded.");

          // Call onSuccess callback
          onSuccess?.();

          // If not redirecting, close the checkout
          if (!event.detail.redirect) {
            setTimeout(() => {
              checkout.close();
            }, 1500);
          }
        });
      } catch (error) {
        console.error("Failed to initialize checkout:", error);
        toast.error("Failed to load checkout. Please try again.");
        setIsLoading(false);
        onClose?.();
      }
    };

    initCheckout();

    // Cleanup on unmount
    return () => {
      if (checkoutInstanceRef.current) {
        checkoutInstanceRef.current.close();
      }
    };
  }, [checkoutUrl, theme, onSuccess, onClose]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-background rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
            <p className="text-sm text-muted-foreground">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  return null; // The embedded checkout is managed by PolarEmbedCheckout
}
