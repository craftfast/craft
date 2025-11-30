/**
 * Admin Billing Page
 *
 * View billing overview, transactions, and revenue stats
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  DollarSign,
  CreditCard,
  TrendingUp,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  taxAmount: number | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Stats {
  totalRevenue: number;
  totalTax: number;
  completedTransactions: number;
  totalTopups: number;
  topupAmount: number;
  aiUsageCalls: number;
  aiUsageCost: number;
}

export default function AdminBillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/billing?period=${period}&page=${page}&limit=20`
      );
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.transactions);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || "Failed to fetch billing data");
      }
    } catch (error) {
      console.error("Error fetching billing:", error);
      toast.error("Failed to fetch billing data");
    } finally {
      setLoading(false);
    }
  }, [period, page]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Billing
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Payment transactions and revenue overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchBilling}
            variant="outline"
            className="rounded-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                Tax: ${stats.totalTax?.toFixed(2) || "0.00"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.completedTransactions}
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                Completed payments
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Credit Top-ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${stats.topupAmount.toFixed(2)}
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                {stats.totalTopups} top-ups
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4" />
                AI Usage Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                ${stats.aiUsageCost.toFixed(2)}
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                {stats.aiUsageCalls.toLocaleString()} API calls
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profit Margin Card */}
      {stats && (
        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Profit Margin
            </CardTitle>
            <CardDescription>Revenue vs AI usage costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-sm text-neutral-500">Gross Profit</p>
                <p
                  className={`text-2xl font-bold ${
                    stats.totalRevenue - stats.aiUsageCost >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  ${(stats.totalRevenue - stats.aiUsageCost).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Margin</p>
                <p className="text-2xl font-bold">
                  {stats.totalRevenue > 0
                    ? (
                        ((stats.totalRevenue - stats.aiUsageCost) /
                          stats.totalRevenue) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-8 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                      </td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-neutral-500"
                    >
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {tx.user.name || "No name"}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {tx.user.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          ${tx.amount.toFixed(2)} {tx.currency}
                        </div>
                        {tx.taxAmount && (
                          <p className="text-xs text-neutral-500">
                            Tax: ${tx.taxAmount.toFixed(2)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={`rounded-full ${getStatusColor(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-neutral-500 capitalize">
                        {tx.paymentMethod}
                      </td>
                      <td className="px-6 py-4 text-neutral-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 px-6 py-4">
              <div className="text-sm text-neutral-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
