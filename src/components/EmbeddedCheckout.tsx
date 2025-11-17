"use client";

import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

// Use the actual exported type from Polar
type EmbedCheckout = InstanceType<typeof PolarEmbedCheckout>;

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
 * Polar appends iframe directly to document.body with z-index: 2147483647 (max value).
 *
 * @see https://polar.sh/docs/features/checkout/embed
 */
export default function EmbeddedCheckout({
  checkoutUrl,
  onSuccess,
  onClose,
  theme = "light",
}: EmbeddedCheckoutProps) {
  const checkoutInstanceRef = useRef<EmbedCheckout | null>(null);
  const isInitializingRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);

  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onCloseRef.current = onClose;
  }, [onSuccess, onClose]);

  // Initialize checkout when component mounts
  useEffect(() => {
    // Prevent duplicate initialization
    if (isInitializingRef.current || checkoutInstanceRef.current) {
      console.log("⚠️ Checkout already initializing or initialized, skipping");
      return;
    }

    // Clean up any existing Polar iframes before creating new one
    const existingIframes = document.querySelectorAll(
      'iframe[src*="polar.sh"]'
    );
    if (existingIframes.length > 0) {
      console.log(
        `🧹 Cleaning up ${existingIframes.length} existing Polar iframes`
      );
      existingIframes.forEach((iframe) => iframe.remove());
    }

    isInitializingRef.current = true;
    let checkoutInstance: EmbedCheckout | null = null;

    console.log("🚀 Creating Polar checkout...");
    console.log("Checkout URL:", checkoutUrl);
    console.log("Theme:", theme);

    // Add global message listener to debug
    const debugMessageListener = (event: MessageEvent) => {
      // Only log messages from Polar or show all for debugging
      if (
        event.origin.includes("polar.sh") ||
        event.data?.type === "POLAR_CHECKOUT"
      ) {
        console.log("📨 Polar message received:", {
          origin: event.origin,
          data: event.data,
        });
      }
    };
    window.addEventListener("message", debugMessageListener);

    // Expose to window for debugging
    interface WindowWithDebug extends Window {
      debugPolarCheckout?: () => void;
      polarCheckoutInstance?: EmbedCheckout | null;
    }

    (window as WindowWithDebug).debugPolarCheckout = () => {
      console.log("Checkout instance:", checkoutInstance);
      if (checkoutInstance) {
        console.log("Calling close() manually...");
        checkoutInstance.close();
      } else {
        console.log("No checkout instance found");
      }
    };

    // Set a timeout to check if checkout never loads
    const loadTimeout = setTimeout(() => {
      if (!checkoutInstance) {
        console.error("⏰ TIMEOUT: Checkout didn't load in 10 seconds");
        console.log(
          "This usually means the Polar iframe isn't sending the 'loaded' message"
        );
        console.log("Try refreshing the page or check your network tab");
      }
    }, 10000);

    // Call create and attach listeners when ready
    PolarEmbedCheckout.create(checkoutUrl, theme)
      .then((checkout) => {
        clearTimeout(loadTimeout);
        checkoutInstance = checkout;
        checkoutInstanceRef.current = checkout;
        (window as WindowWithDebug).polarCheckoutInstance = checkout;

        console.log("✅ Polar checkout loaded and ready");
        console.log(
          "Try calling: window.debugPolarCheckout() to manually close"
        );

        // Attach event listeners
        checkout.addEventListener("loaded", () => {
          console.log("📦 Loaded event fired");
        });

        checkout.addEventListener("success", (event) => {
          console.log("💰 Success event fired", event);
          toast.success("Payment successful! Your plan has been upgraded.");
          onSuccessRef.current?.();

          if (!event.detail.redirect) {
            setTimeout(() => {
              console.log("Closing checkout after success");
              checkout.close();
            }, 1500);
          }
        });

        checkout.addEventListener("close", () => {
          console.log("❌ Close event fired");
          checkoutInstance = null;
          checkoutInstanceRef.current = null;
          isInitializingRef.current = false;
          (window as WindowWithDebug).polarCheckoutInstance = null;
          onCloseRef.current?.();
        });

        console.log("🎯 All event listeners attached");
      })
      .catch((error) => {
        clearTimeout(loadTimeout);
        console.error("❌ Failed to create checkout:", error);
        toast.error("Failed to load checkout. Please try again.");
        isInitializingRef.current = false;
        onCloseRef.current?.();
      });

    // Cleanup on unmount
    return () => {
      console.log("🧹 Component unmounting");
      clearTimeout(loadTimeout);
      window.removeEventListener("message", debugMessageListener);
      if (checkoutInstance) {
        try {
          checkoutInstance.close();
        } catch (e) {
          console.error("Error closing checkout:", e);
        }
      }
      checkoutInstance = null;
      checkoutInstanceRef.current = null;
      isInitializingRef.current = false;
    };
  }, [checkoutUrl, theme]); // Include deps that should trigger re-initialization

  // Polar manages its own rendering via document.body.appendChild
  return null;
}
