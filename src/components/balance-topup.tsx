/**
 * Razorpay Checkout Component
 *
 * Example component showing how to integrate Razorpay for balance top-ups.
 * This can be used in your billing/settings page.
 */

"use client";

import { useState } from "react";
import { useRazorpay } from "@/hooks/use-razorpay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BalanceTopUpProps {
  userEmail: string;
  userName?: string;
  onSuccess?: () => void;
}

export function BalanceTopUp({
  userEmail,
  userName,
  onSuccess,
}: BalanceTopUpProps) {
  const [amount, setAmount] = useState<number>(25);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isLoaded, openCheckout } = useRazorpay();

  const suggestedAmounts = [10, 25, 50, 100, 250];

  const handleTopUp = async () => {
    if (amount < 1) {
      toast.error("Minimum top-up amount is $1");
      return;
    }

    setIsProcessing(true);

    try {
      // Create Razorpay order
      const response = await fetch("/api/balance/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create order");
      }

      const data = await response.json();

      // Open Razorpay checkout
      openCheckout({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Craft",
        description: `Top-up $${data.requestedBalance} (+ $${data.platformFee} fee)`,
        image: "/logo.png", // Optional: Add your logo
        prefill: {
          email: userEmail,
          name: userName,
        },
        theme: {
          color: "#000000",
        },
        handler: async (response) => {
          // Payment successful
          toast.success(
            `Successfully added $${data.requestedBalance} to your balance!`
          );

          // Refresh balance
          if (onSuccess) {
            onSuccess();
          }

          // Dispatch custom event for credit update
          const event = new CustomEvent("credits-updated");
          window.dispatchEvent(event);
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.info("Payment cancelled");
          },
        },
      });
    } catch (error) {
      console.error("Top-up error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process top-up"
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Top-Up Amount</Label>
        <Input
          id="amount"
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
          placeholder="Enter amount"
        />
        <p className="text-sm text-neutral-500">
          You&apos;ll be charged ${(amount * 1.1).toFixed(2)} (includes 10%
          platform fee)
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestedAmounts.map((suggestedAmount) => (
          <Button
            key={suggestedAmount}
            variant="outline"
            size="sm"
            onClick={() => setAmount(suggestedAmount)}
          >
            ${suggestedAmount}
          </Button>
        ))}
      </div>

      <Button
        onClick={handleTopUp}
        disabled={!isLoaded || isProcessing || amount < 1}
        className="w-full"
      >
        {isProcessing ? "Processing..." : `Top Up $${amount}`}
      </Button>
    </div>
  );
}
