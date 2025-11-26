"use client";

import { useState, useEffect } from "react";
import { X, Plus, CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  SUGGESTED_TOPUP_AMOUNTS,
  getCheckoutAmount,
  MINIMUM_BALANCE_AMOUNT,
  PLATFORM_FEE_PERCENT,
} from "@/lib/pricing-constants";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface CustomCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Custom Checkout Modal - OpenRouter Style
 *
 * A clean, modern checkout UI using Razorpay payment gateway.
 * Features:
 * - Saved payment method selection
 * - Clear pricing breakdown with service fees
 * - Quick amount selection buttons
 * - Custom amount input
 * - Smooth animations and transitions
 */
export default function CustomCheckoutModal({
  isOpen,
  onClose,
  onSuccess,
}: CustomCheckoutModalProps) {
  const [amount, setAmount] = useState<number>(50);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (amount < MINIMUM_BALANCE_AMOUNT) {
      toast.error(`Minimum amount is $${MINIMUM_BALANCE_AMOUNT}`);
      return;
    }

    setLoading(true);
    try {
      // Create Razorpay order
      const res = await fetch("/api/balance/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create order");
        return;
      }

      if (data.success && data.orderId) {
        // Load Razorpay SDK if not already loaded
        if (!window.Razorpay) {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        // Initialize Razorpay checkout
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          order_id: data.orderId,
          name: "Craft",
          description: `Top-up $${data.requestedBalance}`,
          theme: {
            color: "#000000",
          },
          handler: function (response: any) {
            toast.success("Payment successful! Credits added to your account.");

            // Dispatch credit update event
            const event = new CustomEvent("credits-updated");
            window.dispatchEvent(event);

            onSuccess();
            onClose();
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          console.error("Payment failed", response.error);
          toast.error("Payment failed. Please try again.");
          setLoading(false);
        });
        rzp.open();
      } else {
        toast.error(data.error || "Failed to create order");
        setLoading(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to create checkout. Please try again.");
      setLoading(false);
    }
  };

  const checkoutAmount = getCheckoutAmount(amount);
  const serviceFee = checkoutAmount - amount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-100">
            Purchase Credits
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-300">
              Amount
            </label>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {SUGGESTED_TOPUP_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    amount === amt
                      ? "bg-neutral-700 text-neutral-100 border-2 border-neutral-500"
                      : "bg-neutral-800/30 text-neutral-400 border border-neutral-700 hover:border-neutral-600"
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1.5 block">
                Custom Amount
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={MINIMUM_BALANCE_AMOUNT}
                placeholder={`Min $${MINIMUM_BALANCE_AMOUNT}`}
                className="h-12 rounded-xl bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Billing Address Link */}
          <button className="text-sm text-neutral-400 hover:text-neutral-300 underline decoration-dotted">
            Edit Tax ID
          </button>

          {/* Advanced Invoicing Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-800/30 border border-neutral-700">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <svg
                  className="w-4 h-4 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-300">
                  Send me invoices
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Automatically receive invoices when your balance drops below a
                  certain threshold
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-600"></div>
            </label>
          </div>

          {/* Price Breakdown */}
          <div className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Balance to add</span>
              <span className="font-mono text-neutral-200">
                ${amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Service fees</span>
              <span className="font-mono text-neutral-200">
                ${serviceFee.toFixed(2)}
              </span>
            </div>
            <div className="h-px bg-neutral-700" />
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Sales taxes</span>
              <span className="text-neutral-400">N/A</span>
            </div>
            <div className="h-px bg-neutral-700" />
            <div className="flex justify-between text-base font-semibold pt-1">
              <span className="text-neutral-200">Total due</span>
              <span className="font-mono text-neutral-100">
                ${checkoutAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={loading || amount < MINIMUM_BALANCE_AMOUNT}
            className="w-full h-12 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Opening checkout..." : "Continue to Payment"}
          </Button>

          {/* Error Message */}
          {amount < MINIMUM_BALANCE_AMOUNT && (
            <p className="text-xs text-red-400 text-center">
              Minimum amount is ${MINIMUM_BALANCE_AMOUNT}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
