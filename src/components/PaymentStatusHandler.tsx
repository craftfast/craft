"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentStatusHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"checking" | "success" | "failed">(
    "checking"
  );

  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout_status");
    const paymentSuccess = searchParams.get("payment_success");

    if (checkoutStatus === "success" || paymentSuccess === "true") {
      setStatus("success");
      // Clean URL after 3 seconds and redirect to home
      setTimeout(() => {
        router.replace("/");
      }, 3000);
    } else if (checkoutStatus === "failed") {
      setStatus("failed");
    }
  }, [searchParams, router]);

  if (status === "checking") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-background border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 max-w-md mx-4 text-center">
        {status === "success" ? (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Payment Successful!
            </h2>
            <p className="text-muted-foreground mb-6">
              Your subscription has been activated. Redirecting...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-500" />
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Payment Failed
            </h2>
            <p className="text-muted-foreground mb-6">
              There was an issue processing your payment. Please try again.
            </p>
            <Button
              onClick={() => router.replace("/pricing")}
              className="rounded-full"
            >
              Back to Pricing
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
