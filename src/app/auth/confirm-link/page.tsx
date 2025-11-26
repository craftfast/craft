"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

function ConfirmLinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [pendingLink, setPendingLink] = useState<{
    email: string;
    provider: string;
    existingAccount: {
      email: string;
      name: string | null;
    };
    expiresAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid link - no token provided");
      setLoading(false);
      return;
    }

    fetchPendingLink();
  }, [token]);

  const fetchPendingLink = async () => {
    if (!token) return;

    try {
      const res = await fetch(`/api/auth/pending-link?token=${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load link request");
        setLoading(false);
        return;
      }

      setPendingLink(data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching pending link:", err);
      setError("Failed to load link request");
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!token) return;

    setProcessing(true);

    try {
      const res = await fetch("/api/auth/confirm-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to link account");
        setProcessing(false);
        return;
      }

      toast.success("Account linked successfully!");

      // Redirect to home
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error("Error confirming link:", err);
      toast.error("Failed to link account");
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;

    setProcessing(true);

    try {
      const res = await fetch("/api/auth/reject-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to reject link");
        setProcessing(false);
        return;
      }

      toast.success("Account link rejected");

      // Redirect to home
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error("Error rejecting link:", err);
      toast.error("Failed to reject link");
      setProcessing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-full max-w-md p-8">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-neutral-900 dark:border-neutral-100 border-r-transparent dark:border-r-transparent"></div>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400">
              Loading link request...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !pendingLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-full max-w-md p-8">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Invalid Link
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {error || "This link is invalid or has expired."}
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!isPending && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-full max-w-md p-8">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
            <div className="text-center mb-6">
              <div className="mb-4 text-5xl">🔐</div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Sign In Required
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Please sign in to your existing account to link your{" "}
                <span className="font-medium capitalize">
                  {pendingLink.provider}
                </span>{" "}
                account.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  router.push(
                    `/signin?callbackUrl=/auth/confirm-link?token=${token}`
                  );
                }}
                className="w-full px-6 py-2.5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full px-6 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirm account linking
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-md p-8">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
          <div className="text-center mb-6">
            <div className="mb-4 text-5xl">🔗</div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Link Account
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Do you want to link this{" "}
              <span className="font-medium capitalize">
                {pendingLink.provider}
              </span>{" "}
              account?
            </p>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">
                Provider:
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                {pendingLink.provider}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">
                Email:
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {pendingLink.email}
              </span>
            </div>
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">
                  Link to account:
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {pendingLink.existingAccount.email}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <div className="text-xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                  Security Notice (Issue #15)
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Only confirm if you recognize this account. Your{" "}
                  {pendingLink.provider} email must match your account email (
                  {pendingLink.existingAccount.email}) to link successfully.
                  This ensures you control the OAuth account.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={processing}
              className="w-full px-6 py-2.5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Processing..." : "Confirm & Link Account"}
            </button>
            <button
              onClick={handleReject}
              disabled={processing}
              className="w-full px-6 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Processing..." : "Reject"}
            </button>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-6">
            Link expires {new Date(pendingLink.expiresAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ConfirmLinkContent />
    </Suspense>
  );
}
