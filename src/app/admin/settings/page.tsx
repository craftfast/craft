/**
 * Admin Settings Page
 *
 * Self-hosting configuration and system settings
 * Designed for indie hackers and open-source deployments
 */

"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Database,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Download,
  CheckCircle,
  XCircle,
  Users,
  FolderKanban,
  DollarSign,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SystemSettings {
  maintenanceMode: boolean;
  signupsEnabled: boolean;
  maxProjectsPerUser: number;
  defaultBalance: number;
}

interface SystemHealth {
  database: "healthy" | "degraded" | "down";
  redis: "healthy" | "degraded" | "down";
  e2b: "healthy" | "degraded" | "down";
  storage: "healthy" | "degraded" | "down";
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    signupsEnabled: true,
    maxProjectsPerUser: 50,
    defaultBalance: 0,
  });
  const [health, setHealth] = useState<SystemHealth>({
    database: "healthy",
    redis: "healthy",
    e2b: "healthy",
    storage: "healthy",
  });
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchHealth();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch("/api/admin/health");
      if (response.ok) {
        const data = await response.json();
        if (data.health) {
          setHealth(data.health);
        }
      }
    } catch (error) {
      console.error("Error fetching health:", error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Settings saved to database");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseCleanup = async () => {
    if (
      !confirm(
        "This will remove expired sessions, old security events, and orphaned files. Continue?"
      )
    )
      return;

    setCleanupLoading(true);
    try {
      const response = await fetch("/api/admin/cleanup", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Cleanup completed");
      } else {
        toast.error("Failed to cleanup database");
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
      toast.error("Failed to cleanup database");
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleExportData = async (
    type: "users" | "transactions" | "usage" | "invoices"
  ) => {
    setExportLoading(true);
    try {
      const response = await fetch(`/api/admin/export?type=${type}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}-export-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success(`Exported ${type} data`);
      } else {
        toast.error(`Failed to export ${type}`);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const getHealthIcon = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "down":
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getHealthBadge = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy":
        return (
          <Badge className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            Healthy
          </Badge>
        );
      case "degraded":
        return (
          <Badge className="rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
            Degraded
          </Badge>
        );
      case "down":
        return (
          <Badge className="rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            Down
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Settings
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Configure your self-hosted Craft instance
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={loading}
          className="rounded-full"
        >
          {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save Settings
        </Button>
      </div>

      {/* System Health */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Status of external services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                {getHealthIcon(health.database)}
                <span className="font-medium">Database</span>
              </div>
              {getHealthBadge(health.database)}
            </div>
            <div className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                {getHealthIcon(health.redis)}
                <span className="font-medium">Redis</span>
              </div>
              {getHealthBadge(health.redis)}
            </div>
            <div className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                {getHealthIcon(health.e2b)}
                <span className="font-medium">E2B Sandbox</span>
              </div>
              {getHealthBadge(health.e2b)}
            </div>
            <div className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                {getHealthIcon(health.storage)}
                <span className="font-medium">Storage</span>
              </div>
              {getHealthBadge(health.storage)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instance Settings */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Instance Settings
          </CardTitle>
          <CardDescription>
            Settings persist in database and survive restarts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Maintenance Mode
              </div>
              <div className="text-sm text-neutral-500">
                Only admins can access the platform when enabled
              </div>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(v) =>
                setSettings({ ...settings, maintenanceMode: v })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                New Signups
              </div>
              <div className="text-sm text-neutral-500">
                Allow new user registrations
              </div>
            </div>
            <Switch
              checked={settings.signupsEnabled}
              onCheckedChange={(v) =>
                setSettings({ ...settings, signupsEnabled: v })
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Max Projects Per User
              </Label>
              <Input
                type="number"
                value={settings.maxProjectsPerUser}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxProjectsPerUser: parseInt(e.target.value) || 50,
                  })
                }
                className="rounded-xl"
                placeholder="0 = unlimited"
              />
              <p className="text-xs text-neutral-500">Set to 0 for unlimited</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Default Starting Balance (USD)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={settings.defaultBalance}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultBalance: parseFloat(e.target.value) || 0,
                  })
                }
                className="rounded-xl"
                placeholder="0.00"
              />
              <p className="text-xs text-neutral-500">
                Credits given to new users
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Export
          </CardTitle>
          <CardDescription>
            Export data as CSV for backup or migration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => handleExportData("users")}
              disabled={exportLoading}
              className="rounded-full"
            >
              <Users className="h-4 w-4 mr-2" />
              Export Users
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData("transactions")}
              disabled={exportLoading}
              className="rounded-full"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Export Transactions
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData("invoices")}
              disabled={exportLoading}
              className="rounded-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export Invoices (GST)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportData("usage")}
              disabled={exportLoading}
              className="rounded-full"
            >
              <Database className="h-4 w-4 mr-2" />
              Export AI Usage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Maintenance */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Maintenance
          </CardTitle>
          <CardDescription>
            Clean up old data to keep your instance fast
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
            <div>
              <div className="font-medium">Cleanup Old Records</div>
              <div className="text-sm text-neutral-500">
                Removes: expired sessions, old security events (90d+), deleted
                files
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleDatabaseCleanup}
              disabled={cleanupLoading}
              className="rounded-full"
            >
              {cleanupLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Run Cleanup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle>Instance Information</CardTitle>
          <CardDescription>Current deployment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
              <div className="text-sm text-neutral-500">Environment</div>
              <div className="font-medium">
                {process.env.NODE_ENV || "development"}
              </div>
            </div>
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
              <div className="text-sm text-neutral-500">Database</div>
              <div className="font-medium">PostgreSQL</div>
            </div>
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
              <div className="text-sm text-neutral-500">Framework</div>
              <div className="font-medium">Next.js 15</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
