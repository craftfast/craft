"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  Loader2,
  Database,
  AlertCircle,
  Trash2,
  RefreshCw,
  Key,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { INFRASTRUCTURE_COSTS } from "@/lib/pricing-constants";
import {
  handleBillingError,
  isBillingError,
} from "@/lib/billing-error-handler";

interface DatabaseConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

interface SupabaseStatus {
  enabled: boolean;
  status?:
    | "active"
    | "inactive"
    | "provisioning"
    | "paused"
    | "paused_low_balance"
    | "resuming"
    | "error";
  projectRef?: string;
  apiUrl?: string;
  provisionedAt?: string;
  health?: {
    healthy: boolean;
    services: Record<string, boolean>;
  };
}

interface SupabaseCredentials {
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  databaseUrl: string;
  databaseHost: string;
  databasePort: number;
  databaseName: string;
  databaseUser: string;
}

export default function DatabaseConnectionDialog({
  open,
  onOpenChange,
  projectId,
}: DatabaseConnectionDialogProps) {
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [credentials, setCredentials] = useState<SupabaseCredentials | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check status when dialog opens
  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/supabase/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.credentials) {
          setCredentials(data.credentials);
        }
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to check status");
      }
    } catch (err) {
      console.error("Failed to check Supabase status:", err);
      setError("Failed to check database status");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      checkStatus();
    }
  }, [open, checkStatus]);

  // Poll for status while provisioning
  useEffect(() => {
    if (status?.status === "provisioning") {
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [status?.status, checkStatus]);

  const handleProvision = async () => {
    setIsProvisioning(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/supabase/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Handle billing errors (402)
      if (isBillingError(res)) {
        await handleBillingError(res);
        setError("Insufficient balance. Please add credits.");
        setIsProvisioning(false);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        toast.success("Database provisioning started!");
        setStatus({
          enabled: true,
          status: "provisioning",
          projectRef: data.projectRef,
        });
        // Start polling for status
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to provision database");
        toast.error(errorData.error || "Failed to provision database");
      }
    } catch (err) {
      console.error("Failed to provision Supabase:", err);
      setError("Failed to provision database");
      toast.error("Failed to provision database");
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/supabase/status`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Database deleted successfully");
        setStatus({ enabled: false });
        setCredentials(null);
        setShowDeleteConfirm(false);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to delete database");
        toast.error(errorData.error || "Failed to delete database");
      }
    } catch (err) {
      console.error("Failed to delete Supabase:", err);
      setError("Failed to delete database");
      toast.error("Failed to delete database");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResume = async () => {
    setIsResuming(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/supabase/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Handle billing errors (402)
      if (isBillingError(res)) {
        await handleBillingError(res);
        setError("Insufficient balance. Please add credits to resume.");
        setIsResuming(false);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Database resuming...");
        // Update status immediately
        setStatus((prev) =>
          prev ? { ...prev, status: data.status || "resuming" } : null
        );
        // Check status after a short delay
        setTimeout(checkStatus, 3000);
      } else {
        setError(data.error || data.message || "Failed to resume database");
        toast.error(data.error || data.message || "Failed to resume database");
      }
    } catch (err) {
      console.error("Failed to resume Supabase:", err);
      setError("Failed to resume database");
      toast.error("Failed to resume database");
    } finally {
      setIsResuming(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatCost = (cost: number) => `$${cost.toFixed(3)}`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-2xl sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database
            </DialogTitle>
            <DialogDescription>
              Enable a PostgreSQL database powered by Supabase for your project.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4 space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading State */}
            {isLoading && !status && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Not Enabled State */}
            {!isLoading && status && !status.enabled && (
              <div className="space-y-4">
                {/* Supabase Card */}
                <div className="border rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
                      <svg
                        className="w-6 h-6"
                        viewBox="0 0 109 113"
                        fill="none"
                      >
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
                      <h3 className="font-semibold">Supabase Database</h3>
                      <p className="text-xs text-muted-foreground">
                        PostgreSQL with auth, storage & real-time
                      </p>
                    </div>
                  </div>

                  {/* Pricing Info */}
                  <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Usage-Based Pricing
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Compute:</span>
                        <span className="ml-1 font-mono">
                          {formatCost(
                            INFRASTRUCTURE_COSTS.supabase.computePerHour
                          )}
                          /hr
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          DB Storage:
                        </span>
                        <span className="ml-1 font-mono">
                          {formatCost(
                            INFRASTRUCTURE_COSTS.supabase
                              .databaseStoragePerGBMonth
                          )}
                          /GB
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          File Storage:
                        </span>
                        <span className="ml-1 font-mono">
                          {formatCost(
                            INFRASTRUCTURE_COSTS.supabase.fileStoragePerGBMonth
                          )}
                          /GB
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Egress:</span>
                        <span className="ml-1 font-mono">
                          {formatCost(
                            INFRASTRUCTURE_COSTS.supabase.egressPerGB
                          )}
                          /GB
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pauses automatically after 15 min of inactivity
                    </p>
                  </div>

                  <Button
                    onClick={handleProvision}
                    disabled={isProvisioning}
                    className="w-full rounded-lg"
                  >
                    {isProvisioning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Provisioning...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Enable Database
                      </>
                    )}
                  </Button>
                </div>

                {/* Features List */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Includes:</p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-neutral-500" />
                      PostgreSQL database with auto-scaling
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-neutral-500" />
                      Authentication & user management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-neutral-500" />
                      Real-time subscriptions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-neutral-500" />
                      File & media storage
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Provisioning State */}
            {!isLoading && status?.status === "provisioning" && (
              <div className="space-y-4">
                <div className="border rounded-xl p-6 space-y-4 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-600" />
                  <div>
                    <h3 className="font-semibold">Provisioning Database</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This usually takes 1-2 minutes...
                    </p>
                  </div>
                  {status.projectRef && (
                    <p className="text-xs font-mono text-muted-foreground">
                      Project: {status.projectRef}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Enabled/Active State */}
            {!isLoading && status?.enabled && status.status === "active" && (
              <div className="space-y-4">
                {/* Status Card */}
                <div className="border rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Database className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Database Active</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          {status.projectRef}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-500">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCredentials(!showCredentials)}
                      variant="outline"
                      className="flex-1 rounded-lg"
                      size="sm"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      {showCredentials ? "Hide" : "Show"} Credentials
                    </Button>
                    <Button
                      onClick={checkStatus}
                      variant="outline"
                      className="rounded-lg"
                      size="sm"
                      disabled={isLoading}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>

                  {/* Credentials */}
                  {showCredentials && credentials && (
                    <div className="space-y-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Supabase URL
                        </label>
                        <div
                          className="text-xs font-mono p-2 bg-white dark:bg-neutral-800 rounded cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 truncate"
                          onClick={() =>
                            copyToClipboard(credentials.supabaseUrl, "URL")
                          }
                        >
                          {credentials.supabaseUrl}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Anon Key
                        </label>
                        <div
                          className="text-xs font-mono p-2 bg-white dark:bg-neutral-800 rounded cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 truncate"
                          onClick={() =>
                            copyToClipboard(credentials.anonKey, "Anon Key")
                          }
                        >
                          {credentials.anonKey.slice(0, 20)}...
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Click any value to copy. Credentials are auto-injected
                        as environment variables.
                      </p>
                    </div>
                  )}

                  {/* External Links */}
                  <div className="flex gap-2">
                    {status.apiUrl && status.projectRef && (
                      <Button
                        onClick={() =>
                          window.open(
                            `${status.apiUrl!.replace(
                              ".supabase.co",
                              ".supabase.com"
                            )}/project/${status.projectRef}`,
                            "_blank"
                          )
                        }
                        variant="ghost"
                        className="flex-1 rounded-lg text-sm"
                        size="sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Dashboard
                      </Button>
                    )}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border border-red-200 dark:border-red-900 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-red-700 dark:text-red-400">
                        Delete Database
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Permanently delete this database and all data
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Paused State */}
            {!isLoading && status?.status === "paused" && (
              <div className="space-y-4">
                <div className="border rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Database className="w-5 h-5 text-neutral-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Database Paused</h3>
                        <p className="text-xs text-muted-foreground">
                          Will resume automatically on next query
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span className="text-xs font-medium text-yellow-600 dark:text-yellow-500">
                        Paused
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paused Due to Low Balance State */}
            {!isLoading && status?.status === "paused_low_balance" && (
              <div className="space-y-4">
                <div className="border border-orange-200 dark:border-orange-900 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-orange-700 dark:text-orange-400">
                          Database Paused - Low Balance
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Add credits and click Resume to re-enable
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-500">
                        Paused
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open("/settings/billing", "_blank")}
                      variant="outline"
                      className="flex-1 rounded-lg"
                    >
                      Add Credits
                    </Button>
                    <Button
                      onClick={handleResume}
                      disabled={isResuming}
                      className="flex-1 rounded-lg"
                    >
                      {isResuming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Resuming...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Resume Database
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Minimum $0.50 balance required to resume
                  </p>
                </div>

                {/* Info */}
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 text-sm text-muted-foreground">
                  <p>
                    Your database was paused because your account balance fell
                    below the minimum threshold. Your data is safe - simply add
                    credits and resume to continue.
                  </p>
                </div>
              </div>
            )}

            {/* Resuming State */}
            {!isLoading && status?.status === "resuming" && (
              <div className="space-y-4">
                <div className="border rounded-xl p-6 space-y-4 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-600" />
                  <div>
                    <h3 className="font-semibold">Resuming Database</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This usually takes about a minute...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Database?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your Supabase database and all its
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Database"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
