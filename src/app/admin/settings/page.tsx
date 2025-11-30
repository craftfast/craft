/**
 * Admin Settings Page
 *
 * Admin-specific settings and configuration
 */

"use client";

import { useState } from "react";
import {
  Settings,
  Shield,
  Bell,
  Database,
  Trash2,
  RefreshCw,
  AlertTriangle,
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
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const handleClearCache = async () => {
    toast.info("Cache clearing functionality coming soon");
  };

  const handleDatabaseCleanup = async () => {
    toast.info("Database cleanup functionality coming soon");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Settings
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Admin panel configuration and system settings
        </p>
      </div>

      {/* System Settings */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure system-wide settings and modes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Maintenance Mode</div>
              <div className="text-sm text-neutral-500">
                When enabled, users will see a maintenance page
              </div>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Debug Mode</div>
              <div className="text-sm text-neutral-500">
                Enable verbose logging for debugging
              </div>
            </div>
            <Switch checked={debugMode} onCheckedChange={setDebugMode} />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure admin notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-neutral-500">
                Receive email alerts for important events
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Security Alerts</div>
              <div className="text-sm text-neutral-500">
                Get notified about security-related events
              </div>
            </div>
            <Switch
              checked={securityAlerts}
              onCheckedChange={setSecurityAlerts}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Security and access configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <div className="font-medium">Two-Factor Authentication</div>
                <div className="text-sm text-neutral-500 mt-1">
                  We recommend enabling 2FA for all admin accounts. Configure
                  this in your personal account settings.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Actions */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Actions
          </CardTitle>
          <CardDescription>Database maintenance and cleanup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
            <div>
              <div className="font-medium">Clear Cache</div>
              <div className="text-sm text-neutral-500">
                Clear application cache and temporary data
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleClearCache}
              className="rounded-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
            <div>
              <div className="font-medium">Database Cleanup</div>
              <div className="text-sm text-neutral-500">
                Remove orphaned records and optimize database
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleDatabaseCleanup}
              className="rounded-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cleanup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle>Environment Information</CardTitle>
          <CardDescription>Current deployment configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
              <div className="text-sm text-neutral-500">Environment</div>
              <div className="font-medium">
                {process.env.NODE_ENV || "development"}
              </div>
            </div>
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
              <div className="text-sm text-neutral-500">Version</div>
              <div className="font-medium">Beta</div>
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
