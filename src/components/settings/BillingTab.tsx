"use client";

/**
 * BillingTab Component
 *
 * Minimalistic billing page showing balance and top-up history
 * Uses transparent pay-as-you-go pricing with no subscriptions
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, Receipt, ChevronRight } from "lucide-react";
import CustomCheckoutModal from "@/components/CustomCheckoutModal";
import {
  MINIMUM_BALANCE_AMOUNT,
  PLATFORM_FEE_PERCENT,
  GST_PERCENT,
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
  const [balance, setBalance] = useState<number | null>(null);
  const [topups, setTopups] = useState<Transaction[]>([]);
  const [loadingTopups, setLoadingTopups] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchTopups();
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

  const fetchTopups = async () => {
    setLoadingTopups(true);
    try {
      // Only fetch TOPUP transactions
      const res = await fetch("/api/balance/transactions?limit=5&type=TOPUP");
      const data = await res.json();
      if (data.success) {
        setTopups(data.transactions);
      }
    } catch (error) {
      console.error("Failed to fetch topups:", error);
    } finally {
      setLoadingTopups(false);
    }
  };

  const handleCheckoutSuccess = () => {
    fetchBalance();
    fetchTopups();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <>
      {/* Custom Checkout Modal */}
      <CustomCheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onSuccess={handleCheckoutSuccess}
      />

      <div className="space-y-6">
        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-neutral-400" />
              <span className="text-sm text-neutral-400">
                Available Balance
              </span>
            </div>

            {balance !== null ? (
              <p className="text-4xl font-bold text-white font-mono tracking-tight">
                ${balance.toFixed(2)}
              </p>
            ) : (
              <div className="animate-pulse h-10 w-32 bg-white/10 rounded-lg" />
            )}

            <Button
              onClick={() => setShowCheckoutModal(true)}
              className="mt-6 w-full rounded-full h-11 bg-white text-neutral-900 hover:bg-neutral-100 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Credits
            </Button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {(PLATFORM_FEE_PERCENT * 100).toFixed(0)}% fee +{" "}
              {(GST_PERCENT * 100).toFixed(0)}% GST
            </span>{" "}
            on top-ups • Min ${MINIMUM_BALANCE_AMOUNT} • No subscriptions
          </div>
          <a
            href="/pricing"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            View pricing
          </a>
        </div>

        {/* Recent Top-ups */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                Recent Top-ups
              </h3>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            {loadingTopups ? (
              <div className="divide-y divide-border">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="animate-pulse flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="animate-pulse h-4 w-16 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : topups.length > 0 ? (
              <div className="divide-y divide-border">
                {topups.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Credit Top-up
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold font-mono text-foreground">
                      +${tx.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No top-ups yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add credits to start building
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
