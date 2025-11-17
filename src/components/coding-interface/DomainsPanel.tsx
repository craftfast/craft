"use client";

import { useState } from "react";

interface DomainsPanelProps {
  projectId: string;
}

interface Domain {
  id: string;
  name: string;
  status: "active" | "pending" | "error";
  sslEnabled: boolean;
  addedDate: string;
}

export default function DomainsPanel({ projectId }: DomainsPanelProps) {
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  console.log("DomainsPanel projectId:", projectId);

  const domains: Domain[] = [
    {
      id: "1",
      name: "myapp.com",
      status: "active",
      sslEnabled: true,
      addedDate: "2025-01-15",
    },
    {
      id: "2",
      name: "www.myapp.com",
      status: "active",
      sslEnabled: true,
      addedDate: "2025-01-15",
    },
    {
      id: "3",
      name: "staging.myapp.com",
      status: "pending",
      sslEnabled: false,
      addedDate: "2025-01-20",
    },
  ];

  const getStatusColor = (status: Domain["status"]) => {
    switch (status) {
      case "active":
        return "bg-neutral-700 dark:bg-neutral-300";
      case "pending":
        return "bg-neutral-400 dark:bg-neutral-600";
      case "error":
        return "bg-neutral-900 dark:bg-neutral-100";
      default:
        return "bg-neutral-500";
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Domains & SSL
        </h2>
        <button
          onClick={() => setShowAddDomain(true)}
          className="px-4 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:opacity-80 transition-opacity"
        >
          Add Domain
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Add Domain Form */}
        {showAddDomain && (
          <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Add New Domain
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="flex-1 px-4 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
              />
              <button
                onClick={() => {
                  setShowAddDomain(false);
                  setNewDomain("");
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:opacity-80 transition-opacity">
                Add
              </button>
            </div>
          </div>
        )}

        {/* Domains List */}
        <div className="space-y-4">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {domain.name}
                    </h3>
                    <span
                      className={`w-2 h-2 rounded-full ${getStatusColor(
                        domain.status
                      )}`}
                    />
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Added {domain.addedDate}
                  </p>
                </div>
                <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors">
                  <svg
                    className="w-4 h-4 text-neutral-600 dark:text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    Status:
                  </span>
                  <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                    {domain.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    SSL:
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      domain.sslEnabled
                        ? "text-neutral-700 dark:text-neutral-300"
                        : "text-neutral-500 dark:text-neutral-500"
                    }`}
                  >
                    {domain.sslEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              {domain.status === "pending" && (
                <div className="mt-3 p-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl">
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 mb-2 font-medium">
                    DNS Configuration Required
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                    Add these DNS records to your domain provider:
                  </p>
                  <div className="space-y-1">
                    <div className="flex gap-2 text-xs font-mono bg-white dark:bg-neutral-800 p-2 rounded-lg">
                      <span className="text-neutral-500">A</span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        @ → 192.168.1.1
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
