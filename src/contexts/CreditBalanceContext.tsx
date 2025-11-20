"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSession } from "@/lib/auth-client";

interface CreditBalance {
  totalAvailable: number;
}

interface CreditBalanceContextType {
  balance: CreditBalance | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CreditBalanceContext = createContext<
  CreditBalanceContextType | undefined
>(undefined);

/**
 * Credit Balance Provider
 *
 * Provides a single source of truth for credit balance across the entire app.
 * This prevents multiple API calls when multiple components need the balance.
 *
 * Balance-based system: Users top up their account and credits are deducted per use.
 * No subscription tiers, no monthly resets.
 *
 * Usage:
 * 1. Wrap your app with <CreditBalanceProvider>
 * 2. Use useCreditBalance() hook in any component
 */
export function CreditBalanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/credits", {
        cache: "no-cache",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch credit balance");
      }

      const data = await response.json();
      setBalance(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching credit balance:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch - only when session is authenticated
  useEffect(() => {
    if (!isPending && session) {
      fetchBalance();
    } else if (!isPending && !session) {
      setIsLoading(false);
      setBalance(null);
    }
  }, [isPending, session, fetchBalance]);

  // Listen for custom credit update events
  useEffect(() => {
    const handleCreditUpdate = () => {
      console.log("💰 Credits updated event received, refreshing balance...");
      fetchBalance();
    };

    window.addEventListener("credits-updated", handleCreditUpdate);
    return () =>
      window.removeEventListener("credits-updated", handleCreditUpdate);
  }, [fetchBalance]);

  const value: CreditBalanceContextType = {
    balance,
    isLoading,
    error,
    refresh: fetchBalance,
  };

  return (
    <CreditBalanceContext.Provider value={value}>
      {children}
    </CreditBalanceContext.Provider>
  );
}

/**
 * Hook to access credit balance from any component
 *
 * This hook now reads from the shared context instead of making
 * individual API calls, preventing duplicate requests.
 */
export function useCreditBalance() {
  const context = useContext(CreditBalanceContext);

  if (context === undefined) {
    throw new Error(
      "useCreditBalance must be used within a CreditBalanceProvider"
    );
  }

  return context;
}
