"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import Link from "next/link";

export function BalanceDisplay() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    );
  }

  if (balance === null) return null;

  const color =
    balance > 10
      ? "text-green-600 dark:text-green-500"
      : balance > 5
      ? "text-yellow-600 dark:text-yellow-500"
      : "text-red-600 dark:text-red-500";

  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono font-semibold ${color}`}>
        ${balance.toFixed(2)}
      </span>
      <Button size="sm" variant="outline" asChild>
        <Link href="/?settings=true&tab=billing">
          <DollarSign className="h-4 w-4 mr-1" />
          Add Credits
        </Link>
      </Button>
    </div>
  );
}
