"use client";

/**
 * BillingTab Component
 *
 * Displays account balance with custom checkout modal
 * Uses transparent pay-as-you-go pricing with no subscriptions
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DollarSign, Info, Plus, History } from "lucide-react";
import CustomCheckoutModal from "@/components/CustomCheckoutModal";
import {
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
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

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

  const handleCheckoutSuccess = () => {
    fetchBalance();
    fetchTransactions();
  };

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
      {/* Custom Checkout Modal */}
      <CustomCheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onSuccess={handleCheckoutSuccess}
      />

      <div className="space-y-6">
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
        <div className="p-6 bg-muted/30 rounded-2xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              <h4 className="text-base font-semibold text-foreground">
                Add Credits
              </h4>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Top up your balance with any amount (minimum $
            {MINIMUM_BALANCE_AMOUNT}). A{" "}
            {(PLATFORM_FEE_PERCENT * 100).toFixed(0)}% platform fee is added at
            checkout.
          </p>

          <Button
            onClick={() => setShowCheckoutModal(true)}
            className="w-full rounded-full h-11 text-base font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Purchase Credits
          </Button>
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
    </>
  );
}
