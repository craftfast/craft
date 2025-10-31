"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function UnlockAccountPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid unlock link. No token provided.");
      return;
    }

    // Verify unlock token
    const verifyToken = async () => {
      try {
        const response = await fetch("/api/auth/verify-unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to unlock account");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred while unlocking your account");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <Card className="w-full max-w-md rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <Loader2 className="h-12 w-12 animate-spin text-neutral-600 dark:text-neutral-400" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl text-neutral-900 dark:text-neutral-100">
            {status === "loading" && "Unlocking Account..."}
            {status === "success" && "Account Unlocked!"}
            {status === "error" && "Unlock Failed"}
          </CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <Button
              onClick={() => router.push("/sign-in")}
              className="w-full rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900"
            >
              Sign In Now
            </Button>
          )}
          {status === "error" && (
            <div className="space-y-2">
              <Button
                onClick={() => router.push("/request-unlock")}
                className="w-full rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900"
              >
                Request New Unlock Link
              </Button>
              <Button
                onClick={() => router.push("/sign-in")}
                variant="outline"
                className="w-full rounded-full border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
