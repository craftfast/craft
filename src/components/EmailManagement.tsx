"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Mail,
  Check,
  X,
  Shield,
  AlertCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface UserEmailType {
  id: string;
  email: string;
  isPrimary: boolean;
  isVerified: boolean;
  provider: string | null;
  createdAt: string;
}

export default function EmailManagement() {
  const [emails, setEmails] = useState<UserEmailType[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const res = await fetch("/api/email/list");
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
      toast.error("Failed to load email addresses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch("/api/email/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setNewEmail("");
        fetchEmails();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to add email");
      }
    } catch (error) {
      console.error("Error adding email:", error);
      toast.error("Failed to add email");
    } finally {
      setIsAdding(false);
    }
  };

  const handleMakePrimary = async (emailId: string) => {
    try {
      const res = await fetch("/api/email/make-primary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });

      if (res.ok) {
        toast.success("Primary email updated");
        fetchEmails();
        // Reload the page after a short delay to update session
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update primary email");
      }
    } catch (error) {
      console.error("Error making email primary:", error);
      toast.error("Failed to update primary email");
    }
  };

  const handleResendVerification = async (emailId: string) => {
    try {
      const res = await fetch("/api/email/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });

      if (res.ok) {
        toast.success("Verification email sent");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to send verification email");
      }
    } catch (error) {
      console.error("Error resending verification:", error);
      toast.error("Failed to send verification email");
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    if (!confirm("Are you sure you want to delete this email address?")) {
      return;
    }

    try {
      const res = await fetch("/api/email/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });

      if (res.ok) {
        toast.success("Email deleted");
        fetchEmails();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete email");
      }
    } catch (error) {
      console.error("Error deleting email:", error);
      toast.error("Failed to delete email");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canAddMore = emails.length < 3;
  const primaryEmail = emails.find((e) => e.isPrimary);
  const hasOnlyPrimaryEmail = emails.length === 1 && primaryEmail;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Email Addresses
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your email addresses ({emails.length}/3 used)
          </p>
        </div>
      </div>

      {/* Email List */}
      <div className="space-y-2">
        {emails.map((email) => (
          <div
            key={email.id}
            className="p-3.5 rounded-xl border border-border bg-muted/50 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {email.email}
                  </span>

                  {/* Primary Badge */}
                  {email.isPrimary && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-medium">
                      <Check className="h-3 w-3" />
                      Primary
                    </span>
                  )}

                  {/* Verified Badge */}
                  {email.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-xs font-medium">
                      <Check className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                      <AlertCircle className="h-3 w-3" />
                      Unverified
                    </span>
                  )}

                  {/* Provider Badge */}
                  {email.provider && email.provider !== "credentials" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-400 text-xs font-medium">
                      <Shield className="h-3 w-3" />
                      {email.provider}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-1.5">
                  Added {new Date(email.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!email.isPrimary && email.isVerified && (
                  <button
                    onClick={() => handleMakePrimary(email.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-background hover:bg-accent border border-border text-xs font-medium transition-colors"
                    title="Make primary email"
                  >
                    Set Primary
                  </button>
                )}

                {!email.isVerified && (
                  <button
                    onClick={() => handleResendVerification(email.id)}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Resend verification email"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}

                {!email.isPrimary && (
                  <button
                    onClick={() => handleDeleteEmail(email.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete email"
                    disabled={
                      email.provider !== null &&
                      email.provider !== "credentials"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Provider Warning */}
            {email.provider && email.provider !== "credentials" && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <Shield className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  This email is linked to your {email.provider} account and
                  cannot be deleted while the account is connected.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Email */}
      {canAddMore && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
              placeholder="Add new email address"
              className="flex-1 rounded-xl"
              disabled={isAdding}
            />
            <Button
              onClick={handleAddEmail}
              disabled={isAdding || !newEmail.trim()}
              className="rounded-full"
            >
              {isAdding ? "Adding..." : "Add Email"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add up to 3 total emails (including your primary email). Verify new
            emails to set them as primary.
          </p>
        </div>
      )}

      {!canAddMore && (
        <div className="p-3 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground">
            You've reached the maximum of 3 email addresses. Delete an existing
            email to add a new one.
          </p>
        </div>
      )}
    </div>
  );
}
