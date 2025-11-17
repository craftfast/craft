"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Database, CheckCircle2, Loader2, ExternalLink } from "lucide-react";

interface DatabaseConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

interface IntegrationStatus {
  connected: boolean;
  projectName?: string;
}

export default function DatabaseConnectionDialog({
  open,
  onOpenChange,
  projectId,
}: DatabaseConnectionDialogProps) {
  const [supabaseStatus, setSupabaseStatus] =
    useState<IntegrationStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check integration status when dialog opens
  useEffect(() => {
    if (open) {
      checkIntegrationStatus();
    }
  }, [open]);

  const checkIntegrationStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const supabaseRes = await fetch("/api/integrations/supabase/status");

      if (supabaseRes.ok) {
        const supabaseData = await supabaseRes.json();
        setSupabaseStatus(supabaseData);
      }
    } catch (error) {
      console.error("Failed to check Supabase status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleConnectSupabase = async () => {
    setIsConnecting(true);
    try {
      // Open Supabase dashboard in new tab
      window.open("https://supabase.com/dashboard/projects", "_blank");

      // TODO: In future, implement OAuth or API key connection
      // const res = await fetch("/api/integrations/supabase/connect");
      // const data = await res.json();
      // if (data.url) {
      //   window.location.href = data.url;
      // }
    } catch (error) {
      console.error("Failed to connect Supabase:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOpenSupabaseDocs = () => {
    window.open("https://supabase.com/docs", "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Database</DialogTitle>
          <DialogDescription>
            Connect your project to Supabase for a PostgreSQL database,
            authentication, and real-time features.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          {/* Supabase Option */}
          <div className="border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 109 113" fill="none">
                    <path
                      d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                      fill="url(#paint0_linear)"
                    />
                    <path
                      d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                      fill="url(#paint1_linear)"
                      fillOpacity="0.2"
                    />
                    <path
                      d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                      fill="#3ECF8E"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear"
                        x1="53.9738"
                        y1="54.974"
                        x2="94.1635"
                        y2="71.8295"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#249361" />
                        <stop offset="1" stopColor="#3ECF8E" />
                      </linearGradient>
                      <linearGradient
                        id="paint1_linear"
                        x1="36.1558"
                        y1="30.578"
                        x2="54.4844"
                        y2="65.0806"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop />
                        <stop offset="1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Supabase</h3>
                  <p className="text-xs text-muted-foreground">
                    {supabaseStatus?.connected
                      ? `Connected: ${supabaseStatus.projectName}`
                      : "PostgreSQL database & backend"}
                  </p>
                </div>
              </div>
              {supabaseStatus?.connected && (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
              )}
            </div>

            {supabaseStatus?.connected ? (
              <div className="space-y-2">
                <Button
                  onClick={() =>
                    window.open("https://supabase.com/dashboard", "_blank")
                  }
                  className="w-full rounded-lg"
                  variant="outline"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleConnectSupabase}
                  disabled={isConnecting || isCheckingStatus}
                  className="w-full rounded-lg"
                >
                  {isCheckingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking Status...
                    </>
                  ) : isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect Supabase
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  You&apos;ll be redirected to create or select a project
                </p>
              </div>
            )}
          </div>

          {/* Features List */}
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium">What you get:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                <span>PostgreSQL database with auto-scaling</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                <span>Authentication with social providers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                <span>Real-time subscriptions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                <span>Storage for files and media</span>
              </li>
            </ul>
          </div>

          {/* Documentation Link */}
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={handleOpenSupabaseDocs}
              variant="ghost"
              className="w-full rounded-lg text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Supabase Documentation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
