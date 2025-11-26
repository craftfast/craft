"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { notifyCreditUpdate } from "@/lib/credit-events";

/**
 * Payment Success Handler
 *
 * Detects when users return from Razorpay checkout with ?payment=success
 * Triggers credit balance refresh across all components
 */
export default function PaymentSuccessHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentStatus = searchParams?.get("payment");

    if (paymentStatus === "success") {
      console.log("🎉 Payment successful! Refreshing credits...");

      // Wait a moment for webhook to process (webhook may take 1-2 seconds)
      setTimeout(() => {
        // Notify all components to refresh credits
        notifyCreditUpdate();
      }, 1500);

      // Optional: Add a second refresh after 5 seconds to ensure webhook completed
      setTimeout(() => {
        notifyCreditUpdate();
      }, 5000);

      // Clean up URL (remove ?payment=success)
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url);
    }
  }, [searchParams]);

  // This component renders nothing - it's just for side effects
  return null;
}
