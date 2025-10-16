"use client";

import { useEffect, useState } from "react";

interface CreditBalance {
    totalAvailable: number; // Total tokens available (subscription + purchased)
    subscriptionTokensRemaining: number; // Tokens remaining from monthly allowance
    purchasedTokensRemaining: number; // Tokens remaining from purchases
    subscriptionTokenLimit: number | null; // Monthly token limit from plan
    subscriptionTokensUsed: number; // Tokens used in current period
}

export function useCreditBalance() {
    const [balance, setBalance] = useState<CreditBalance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBalance() {
            try {
                setIsLoading(true);
                const response = await fetch("/api/user/credits");

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
        }

        fetchBalance();
    }, []);

    return { balance, isLoading, error };
}
