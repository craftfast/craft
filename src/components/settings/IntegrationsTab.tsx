"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Key, ExternalLink } from "lucide-react";

interface IntegrationStatus {
  connected: boolean;
  login?: string;
  username?: string;
  email?: string;
}

export default function IntegrationsTab() {
  const [githubStatus, setGithubStatus] = useState<IntegrationStatus | null>(
    null
  );
  const [vercelStatus, setVercelStatus] = useState<IntegrationStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [showVercelTokenInput, setShowVercelTokenInput] = useState(false);
  const [vercelToken, setVercelToken] = useState("");
  const [isConnectingWithToken, setIsConnectingWithToken] = useState(false);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    setIsLoading(true);
    try {
      const [githubRes, vercelRes] = await Promise.all([
        fetch("/api/integrations/github/status"),
        fetch("/api/integrations/vercel/status"),
      ]);

      if (githubRes.ok) {
        const data = await githubRes.json();
        setGithubStatus(data);
      }
      if (vercelRes.ok) {
        const data = await vercelRes.json();
        setVercelStatus(data);
      }
    } catch (error) {
      console.error("Failed to check integration status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (provider: "github" | "vercel") => {
    setConnectingTo(provider);
    try {
      const res = await fetch(`/api/integrations/${provider}/connect`);
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(`Failed to connect to ${provider}`);
      }
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      toast.error(`Failed to connect to ${provider}`);
    } finally {
      setConnectingTo(null);
    }
  };

  const handleVercelTokenConnect = async () => {
    if (!vercelToken.trim()) {
      toast.error("Please enter your Vercel access token");
      return;
    }

    setIsConnectingWithToken(true);
    try {
      const res = await fetch("/api/integrations/vercel/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: vercelToken.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Connected to Vercel as ${data.username || data.email}`);
        setVercelStatus({
          connected: true,
          username: data.username,
          email: data.email,
        });
        setShowVercelTokenInput(false);
        setVercelToken("");
      } else {
        toast.error(data.error || "Failed to connect with token");
      }
    } catch (error) {
      console.error("Failed to connect with token:", error);
      toast.error("Failed to connect with token");
    } finally {
      setIsConnectingWithToken(false);
    }
  };

  const handleDisconnect = async (provider: "github" | "vercel") => {
    try {
      const res = await fetch(`/api/integrations/${provider}/disconnect`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success(`Disconnected from ${provider}`);
        if (provider === "github") setGithubStatus(null);
        if (provider === "vercel") setVercelStatus(null);
      } else {
        toast.error(`Failed to disconnect from ${provider}`);
      }
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
      toast.error(`Failed to disconnect from ${provider}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Connected Services
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your account with third-party services to enhance your
          workflow
        </p>
        <div className="space-y-3">
          {/* GitHub - Functional */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white dark:text-neutral-900"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">GitHub</p>
                <p className="text-xs text-muted-foreground">
                  {githubStatus?.connected
                    ? `Connected as @${
                        githubStatus.login || githubStatus.username
                      }`
                    : "Deploy and manage repositories"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {githubStatus?.connected && (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
              )}
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : githubStatus?.connected ? (
                <button
                  onClick={() => handleDisconnect("github")}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect("github")}
                  disabled={connectingTo === "github"}
                  className="px-4 py-2 text-sm font-medium bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {connectingTo === "github" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Connect"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Vercel - Functional */}
          <div className="p-4 bg-muted/50 rounded-xl border border-input">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-900 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="white"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L2 20h20L12 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Vercel</p>
                  <p className="text-xs text-muted-foreground">
                    {vercelStatus?.connected
                      ? `Connected as ${
                          vercelStatus.username || vercelStatus.email
                        }`
                      : "Deploy and host your projects"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {vercelStatus?.connected && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                )}
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : vercelStatus?.connected ? (
                  <button
                    onClick={() => handleDisconnect("vercel")}
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConnect("vercel")}
                      disabled={connectingTo === "vercel"}
                      className="px-4 py-2 text-sm font-medium bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50"
                    >
                      {connectingTo === "vercel" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Connect"
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setShowVercelTokenInput(!showVercelTokenInput)
                      }
                      className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-colors"
                      title="Connect with access token"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Token input fallback */}
            {showVercelTokenInput && !vercelStatus?.connected && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span>
                    Create a token at{" "}
                    <a
                      href="https://vercel.com/account/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline hover:no-underline inline-flex items-center gap-1"
                    >
                      vercel.com/account/tokens
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={vercelToken}
                    onChange={(e) => setVercelToken(e.target.value)}
                    placeholder="Paste your Vercel access token"
                    className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={handleVercelTokenConnect}
                    disabled={isConnectingWithToken || !vercelToken.trim()}
                    className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
                  >
                    {isConnectingWithToken ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Connect"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Coming Soon Section */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Coming Soon
            </h4>
            <div className="space-y-3 opacity-60">
              {/* Figma - Coming Soon */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-input/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center border border-input">
                    <svg className="w-6 h-6" viewBox="0 0 38 57" fill="none">
                      <path
                        d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z"
                        fill="#1ABCFE"
                      />
                      <path
                        d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z"
                        fill="#0ACF83"
                      />
                      <path
                        d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z"
                        fill="#FF7262"
                      />
                      <path
                        d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z"
                        fill="#F24E1E"
                      />
                      <path
                        d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z"
                        fill="#A259FF"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Figma</p>
                    <p className="text-xs text-muted-foreground">
                      Import designs and export code
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                  Coming Soon
                </span>
              </div>

              {/* Supabase - Coming Soon */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-input/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#3ecf8e] flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      viewBox="0 0 109 113"
                      fill="currentColor"
                    >
                      <path d="M63.708 110.284c-2.86 3.601-8.658 1.628-8.727-2.97l-1.007-67.251h45.22c8.19 0 12.758 9.46 7.665 15.874l-43.151 54.347z" />
                      <path
                        d="M63.708 110.284c-2.86 3.601-8.658 1.628-8.727-2.97l-1.007-67.251h45.22c8.19 0 12.758 9.46 7.665 15.874l-43.151 54.347z"
                        fillOpacity="0.2"
                      />
                      <path d="M45.317 2.07c2.86-3.601 8.657-1.628 8.726 2.97l.442 67.251H9.83c-8.19 0-12.759-9.46-7.665-15.875L45.317 2.07z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Supabase
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Database and authentication
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                  Coming Soon
                </span>
              </div>

              {/* Notion - Coming Soon */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-input/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center border border-input">
                    <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none">
                      <path
                        d="M6.017 4.313l55.333-4.087c6.797-.583 8.543-.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277-1.553 6.807-6.99 7.193L24.467 99.967c-4.08.193-6.023-.39-8.16-3.113L3.3 79.94c-2.333-3.113-3.3-5.443-3.3-8.167V11.113c0-3.497 1.553-6.413 6.017-6.8z"
                        fill="#fff"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M61.35.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257-3.89c5.433-.387 6.99-2.917 6.99-7.193V20.64c0-2.21-.873-2.847-3.443-4.733L74.167 3.143C69.893.027 68.147-.357 61.35.227zM25.723 19.02c-5.63.34-6.907.417-10.113-2.14L7.89 11.053c-.967-.78-.58-1.753 1.75-1.947l53.773-3.887c4.663-.387 7.03 1.167 8.833 2.53l9.177 6.61c.39.193 1.36 1.36.193 1.36l-55.5 3.3h-.393zm-4.47 74.267V29.577c0-2.527.777-3.697 3.107-3.893l60.293-3.497c2.14-.193 3.107 1.167 3.107 3.693v63.323c0 2.53-.39 4.667-3.883 4.86l-57.577 3.303c-3.497.193-5.047-1.167-5.047-4.08z"
                        fill="#000"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Notion
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sync docs and project notes
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
