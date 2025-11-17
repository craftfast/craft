"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Webhook,
  Plus,
  Trash2,
  RefreshCw,
  Play,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface WebhookManagerProps {
  projectId: string;
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  description?: string;
  lastTriggeredAt?: string;
  createdAt: string;
  _count?: { deliveries: number };
}

const AVAILABLE_EVENTS = [
  { value: "project.created", label: "Project Created" },
  { value: "project.updated", label: "Project Updated" },
  { value: "project.deleted", label: "Project Deleted" },
  { value: "deployment.started", label: "Deployment Started" },
  { value: "deployment.completed", label: "Deployment Completed" },
  { value: "deployment.failed", label: "Deployment Failed" },
  { value: "git.synced", label: "Git Synced" },
  { value: "collaborator.added", label: "Collaborator Added" },
  { value: "collaborator.removed", label: "Collaborator Removed" },
  { value: "file.uploaded", label: "File Uploaded" },
  { value: "webhook.test", label: "Webhook Test" },
  { value: "*", label: "All Events" },
];

export function WebhookManager({ projectId }: WebhookManagerProps) {
  const [loading, setLoading] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form state
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formDescription, setFormDescription] = useState("");
  const [newSecret, setNewSecret] = useState("");

  useEffect(() => {
    fetchWebhooks();
  }, [projectId]);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/webhooks`);
      if (!response.ok) throw new Error("Failed to fetch webhooks");
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (err) {
      console.error("Failed to fetch webhooks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formUrl || formEvents.length === 0) return;

    try {
      setCreating(true);
      const response = await fetch(`/api/projects/${projectId}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: formUrl,
          events: formEvents,
          description: formDescription,
        }),
      });

      if (!response.ok) throw new Error("Failed to create webhook");
      const data = await response.json();

      // Store the secret for display
      setNewSecret(data.webhook.secret);

      // Reset form
      setFormUrl("");
      setFormEvents([]);
      setFormDescription("");

      await fetchWebhooks();
    } catch (err) {
      console.error("Failed to create webhook:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/webhooks/${webhookId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Delete failed");
      setWebhooks(webhooks.filter((w) => w.id !== webhookId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleToggleActive = async (webhookId: string, isActive: boolean) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/webhooks/${webhookId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !isActive }),
        }
      );
      if (!response.ok) throw new Error("Update failed");
      await fetchWebhooks();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleTest = async (webhookId: string) => {
    try {
      setTesting(true);
      const response = await fetch(`/api/projects/${projectId}/webhooks/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId }),
      });
      if (!response.ok) throw new Error("Test failed");
      alert("Test webhook sent successfully!");
    } catch (err) {
      console.error("Test failed:", err);
      alert("Failed to send test webhook");
    } finally {
      setTesting(false);
    }
  };

  const handleViewDetails = async (webhookId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/webhooks/${webhookId}`
      );
      if (!response.ok) throw new Error("Failed to fetch details");
      const data = await response.json();
      setSelectedWebhook(data.webhook);
      setShowDetailDialog(true);
    } catch (err) {
      console.error("Failed to fetch details:", err);
    }
  };

  const toggleEvent = (event: string) => {
    if (formEvents.includes(event)) {
      setFormEvents(formEvents.filter((e) => e !== event));
    } else {
      setFormEvents([...formEvents, event]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Webhooks</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWebhooks}
            disabled={loading}
            className="rounded-full"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="rounded-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Webhook
          </Button>
        </div>
      </div>

      {/* Webhooks Table */}
      <div className="border rounded-xl dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <Webhook className="h-12 w-12 mb-3" />
            <p>No webhooks configured</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deliveries</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-mono text-sm max-w-xs truncate">
                      {webhook.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(webhook.events as string[])
                          .slice(0, 2)
                          .map((event) => (
                            <Badge key={event} variant="outline">
                              {event}
                            </Badge>
                          ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="outline">
                            +{webhook.events.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleToggleActive(webhook.id, webhook.isActive)
                        }
                        className="rounded-full"
                      >
                        <Badge
                          variant={webhook.isActive ? "default" : "outline"}
                        >
                          {webhook.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell>{webhook._count?.deliveries || 0}</TableCell>
                    <TableCell>
                      {webhook.lastTriggeredAt
                        ? new Date(webhook.lastTriggeredAt).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(webhook.id)}
                          className="rounded-full"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(webhook.id)}
                          disabled={testing}
                          className="rounded-full"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(webhook.id)}
                          className="text-red-600 hover:text-red-700 rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>
              Configure a webhook to receive project events
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <Input
                placeholder="https://your-domain.com/webhook"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                className="rounded-full"
              />
            </div>
            <div>
              <Label>Events to Subscribe</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <div
                    key={event.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={event.value}
                      checked={formEvents.includes(event.value)}
                      onCheckedChange={() => toggleEvent(event.value)}
                    />
                    <label
                      htmlFor={event.value}
                      className="text-sm cursor-pointer"
                    >
                      {event.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="What is this webhook for?"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="rounded-xl"
              />
            </div>
            {newSecret && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <Label>Webhook Secret (Save This!)</Label>
                <Input
                  value={newSecret}
                  readOnly
                  className="font-mono mt-2 rounded-full"
                />
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  Use this secret to verify webhook signatures. It will not be
                  shown again.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewSecret("");
              }}
              className="rounded-full"
            >
              {newSecret ? "Close" : "Cancel"}
            </Button>
            {!newSecret && (
              <Button
                onClick={handleCreate}
                disabled={creating || !formUrl || formEvents.length === 0}
                className="rounded-full"
              >
                {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Create Webhook
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl rounded-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Webhook Details</DialogTitle>
          </DialogHeader>
          {selectedWebhook && (
            <div className="space-y-4">
              <div>
                <Label>URL</Label>
                <Input
                  value={selectedWebhook.url}
                  readOnly
                  className="font-mono rounded-full"
                />
              </div>
              <div>
                <Label>Recent Deliveries</Label>
                <div className="border rounded-xl mt-2 overflow-hidden">
                  {selectedWebhook.deliveries?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Response</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedWebhook.deliveries.map((delivery: any) => (
                          <TableRow key={delivery.id}>
                            <TableCell className="font-mono text-sm">
                              {delivery.eventType}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  delivery.status === "success"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {delivery.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {delivery.responseCode || "N/A"}
                            </TableCell>
                            <TableCell>{delivery.attemptCount}</TableCell>
                            <TableCell>
                              {new Date(delivery.createdAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-neutral-500 py-8">
                      No deliveries yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
