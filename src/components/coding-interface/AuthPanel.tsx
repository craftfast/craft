"use client";

import { useState } from "react";

interface AuthPanelProps {
  projectId: string;
}

export default function AuthPanel({ projectId }: AuthPanelProps) {
  const [authMethod, setAuthMethod] = useState<
    "email" | "google" | "github" | "magic-link"
  >("email");
  const [enabledMethods, setEnabledMethods] = useState({
    email: true,
    google: false,
    github: false,
    magicLink: false,
  });

  const toggleMethod = (method: keyof typeof enabledMethods) => {
    setEnabledMethods((prev) => ({
      ...prev,
      [method]: !prev[method],
    }));
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Authentication
        </h2>
        <button className="px-4 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:opacity-80 transition-opacity">
          Save Changes
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* Auth Providers */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Authentication Providers
            </h3>
            <div className="space-y-3">
              {/* Email/Password */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-neutral-700 dark:text-neutral-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Email & Password
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        Traditional email and password authentication
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMethod("email")}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      enabledMethods.email
                        ? "bg-neutral-900 dark:bg-neutral-100"
                        : "bg-neutral-300 dark:bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        enabledMethods.email ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Google */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                      <span className="text-xl">G</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Google
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        Sign in with Google account
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMethod("google")}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      enabledMethods.google
                        ? "bg-neutral-900 dark:bg-neutral-100"
                        : "bg-neutral-300 dark:bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        enabledMethods.google ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                {enabledMethods.google && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                    <input
                      type="text"
                      placeholder="Client ID"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
                    />
                    <input
                      type="password"
                      placeholder="Client Secret"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
                    />
                  </div>
                )}
              </div>

              {/* GitHub */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-neutral-700 dark:text-neutral-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        GitHub
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        Sign in with GitHub account
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMethod("github")}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      enabledMethods.github
                        ? "bg-neutral-900 dark:bg-neutral-100"
                        : "bg-neutral-300 dark:bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        enabledMethods.github ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                {enabledMethods.github && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                    <input
                      type="text"
                      placeholder="Client ID"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
                    />
                    <input
                      type="password"
                      placeholder="Client Secret"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Magic Link */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                      <span className="text-xl">✨</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        Magic Link
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        Passwordless email link authentication
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMethod("magicLink")}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      enabledMethods.magicLink
                        ? "bg-neutral-900 dark:bg-neutral-100"
                        : "bg-neutral-300 dark:bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        enabledMethods.magicLink ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Security Settings */}
          <section className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Require Email Verification
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    Users must verify their email before accessing the app
                  </div>
                </div>
                <button className="w-12 h-6 rounded-full bg-neutral-900 dark:bg-neutral-100 transition-colors relative">
                  <span className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white dark:bg-neutral-900" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Two-Factor Authentication
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    Enable 2FA for additional security
                  </div>
                </div>
                <button className="w-12 h-6 rounded-full bg-neutral-300 dark:bg-neutral-700 transition-colors relative">
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-neutral-900" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
