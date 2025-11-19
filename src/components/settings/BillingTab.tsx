"use client";

/**
 * BillingTab Component
 *
 * Displays account balance with integrated embedded checkout
 * Uses transparent pay-as-you-go pricing with no subscriptions
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Info, Plus, History } from "lucide-react";
import Script from "next/script";
import {
  SUGGESTED_TOPUP_AMOUNTS,
  getCheckoutAmount,
  MINIMUM_BALANCE_AMOUNT,
  PLATFORM_FEE_PERCENT,
} from "@/lib/pricing-constants";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  metadata: any;
}

export function BillingTab() {
  const [amount, setAmount] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [polarLoaded, setPolarLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const checkoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/balance/current");
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const res = await fetch("/api/balance/transactions?limit=10");
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const checkoutAmount = getCheckoutAmount(amount);
  const platformFee = checkoutAmount - amount;

  const handleTopup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/balance/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      if (data.success && data.checkoutId) {
        setCheckoutId(data.checkoutId);
        setShowCheckout(true);

        if (polarLoaded && checkoutRef.current) {
          setTimeout(() => {
            initializePolarCheckout(data.checkoutId);
          }, 100);
        }
      } else {
        alert(data.error || "Failed to create checkout");
      }
    } catch (error) {
      console.error("Top-up error:", error);
      alert("Failed to create checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initializePolarCheckout = (id: string) => {
    if (
      typeof window !== "undefined" &&
      (window as any).Polar &&
      checkoutRef.current
    ) {
      try {
        (window as any).Polar.mount({
          checkoutId: id,
          element: checkoutRef.current,
          theme: "dark",
          onPaymentSuccess: () => {
            setShowCheckout(false);
            setShowSuccess(true);
            fetchBalance();
            fetchTransactions();
            setTimeout(() => setShowSuccess(false), 5000);
          },
          onPaymentError: (error: any) => {
            console.error("Payment error:", error);
            alert("Payment failed. Please try again.");
          },
        });
      } catch (error) {
        console.error("Failed to mount Polar checkout:", error);
      }
    }
  };

  useEffect(() => {
    if (polarLoaded && checkoutId && checkoutRef.current) {
      initializePolarCheckout(checkoutId);
    }
  }, [polarLoaded, checkoutId]);

  const balanceColor =
    balance === null
      ? "text-foreground"
      : balance > 10
      ? "text-green-600 dark:text-green-500"
      : balance > 5
      ? "text-yellow-600 dark:text-yellow-500"
      : "text-red-600 dark:text-red-500";

  return (
    <>
      <div className="space-y-6">
        {showSuccess && (
          <div className="p-4 bg-green-100 dark:bg-green-900/20 border border-green-500 rounded-xl">
            <p className="text-green-700 dark:text-green-300 font-medium text-sm">
              ✅ Payment successful! Your balance has been updated.
            </p>
          </div>
        )}

        {/* Current Balance */}
        <div className="p-6 bg-muted/30 rounded-2xl border border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-foreground">
              Current Balance
            </h3>
            <DollarSign className="w-5 h-5 text-muted-foreground" />
          </div>
          {balance !== null ? (
            <div className="space-y-1">
              <p className={`text-4xl font-bold font-mono ${balanceColor}`}>
                ${balance.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Available for AI, sandboxes, storage, and deployments
              </p>
            </div>
          ) : (
            <div className="animate-pulse space-y-2">
              <div className="h-10 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          )}
        </div>

        {/* Add Credits Section */}
        <div className="p-6 bg-muted/30 rounded-2xl border border-border space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="w-5 h-5 text-primary" />
            <h4 className="text-base font-semibold text-foreground">
              Add Credits
            </h4>
          </div>

          {/* Quick Amounts */}
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTED_TOPUP_AMOUNTS.map((amt) => (
              <Button
                key={amt}
                variant={amount === amt ? "default" : "outline"}
                onClick={() => setAmount(amt)}
                className="h-10 rounded-full"
              >
                ${amt}
              </Button>
            ))}
          </div>

          {/* Custom Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Custom Amount
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={MINIMUM_BALANCE_AMOUNT}
              placeholder={`Min $${MINIMUM_BALANCE_AMOUNT}`}
              className="h-10 rounded-full"
            />
          </div>

          {/* Fee Breakdown */}
          <div className="bg-background/50 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance to add:</span>
              <span className="font-mono font-medium">
                ${amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Platform fee ({(PLATFORM_FEE_PERCENT * 100).toFixed(0)}%):
              </span>
              <span className="font-mono font-medium">
                +${platformFee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2">
              <span>Total to pay:</span>
              <span className="font-mono">${checkoutAmount.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={handleTopup}
            disabled={loading || amount < MINIMUM_BALANCE_AMOUNT}
            className="w-full rounded-full h-11 text-base font-semibold"
          >
            {loading ? "Processing..." : "Add Credits"}
          </Button>

          {amount < MINIMUM_BALANCE_AMOUNT && (
            <p className="text-xs text-red-600 dark:text-red-400 text-center">
              Minimum top-up amount is ${MINIMUM_BALANCE_AMOUNT}
            </p>
          )}
        </div>

        {/* How It Works */}
        <div className="p-6 bg-muted/30 rounded-2xl border border-border">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                How It Works
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Top up your balance with any amount (minimum $10)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>10% platform fee charged once at top-up time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Pay exact provider costs with zero markup on usage
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>No subscriptions, no hidden fees</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Transparent Pricing */}
        <div className="p-6 bg-muted/30 rounded-2xl border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Transparent Pricing
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-muted-foreground">AI Models</span>
              <span className="font-medium text-foreground">
                Exact provider rates
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-muted-foreground">Sandbox (E2B)</span>
              <span className="font-medium text-foreground">$0.001/minute</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-muted-foreground">Storage</span>
              <span className="font-medium text-foreground">
                $0.015/GB/month
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-muted-foreground">Deployments</span>
              <span className="font-medium text-foreground">$0.01/deploy</span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="p-6 bg-muted/30 rounded-2xl border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Recent Transactions
          </h4>
          {loadingTransactions ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center justify-between py-2"
                >
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isPositive = tx.amount > 0;
                const date = new Date(tx.createdAt);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {date.toLocaleDateString()} {date.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-mono font-semibold ${
                          isPositive
                            ? "text-green-600 dark:text-green-500"
                            : "text-red-600 dark:text-red-500"
                        }`}
                      >
                        {isPositive ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Balance: ${tx.balanceAfter.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">
                No transactions yet. Add credits to get started!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-background">
              <h2 className="text-lg font-semibold">Complete Payment</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCheckout(false)}
                className="rounded-full h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
            <div ref={checkoutRef} className="min-h-[500px] p-4" />
          </div>
        </div>
      )}

      {/* Load Polar SDK */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@polar-sh/checkout@latest/dist/index.js"
        onLoad={() => setPolarLoaded(true)}
        strategy="lazyOnload"
      />
    </>
  );
}
