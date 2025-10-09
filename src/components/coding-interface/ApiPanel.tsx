"use client";

import { useState } from "react";

interface ApiPanelProps {
  projectId: string;
}

interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  requestCount: number;
}

export default function ApiPanel({ projectId }: ApiPanelProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [showCreateEndpoint, setShowCreateEndpoint] = useState(false);

  const endpoints: ApiEndpoint[] = [
    {
      id: "1",
      method: "GET",
      path: "/api/users",
      description: "Get all users",
      requestCount: 1234,
    },
    {
      id: "2",
      method: "POST",
      path: "/api/users",
      description: "Create new user",
      requestCount: 456,
    },
    {
      id: "3",
      method: "GET",
      path: "/api/projects",
      description: "Get all projects",
      requestCount: 789,
    },
    {
      id: "4",
      method: "DELETE",
      path: "/api/projects/:id",
      description: "Delete project",
      requestCount: 23,
    },
  ];

  const getMethodColor = (method: ApiEndpoint["method"]) => {
    switch (method) {
      case "GET":
        return "bg-neutral-600 dark:bg-neutral-400 text-white dark:text-neutral-900";
      case "POST":
        return "bg-neutral-700 dark:bg-neutral-300 text-white dark:text-neutral-900";
      case "PUT":
        return "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900";
      case "DELETE":
        return "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900";
      default:
        return "bg-neutral-500";
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          API Endpoints
        </h2>
        <button
          onClick={() => setShowCreateEndpoint(true)}
          className="px-4 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:opacity-80 transition-opacity"
        >
          Create Endpoint
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* API Key Section */}
          <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                API Key
              </h3>
              <button className="px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors">
                Regenerate
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg font-mono text-neutral-700 dark:text-neutral-300">
                craft_sk_1234567890abcdef
              </code>
              <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Endpoints List */}
          <div className="space-y-3">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                onClick={() => setSelectedEndpoint(endpoint.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedEndpoint === endpoint.id
                    ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600"
                    : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded-lg ${getMethodColor(
                        endpoint.method
                      )}`}
                    >
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-neutral-900 dark:text-neutral-100">
                      {endpoint.path}
                    </code>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {endpoint.requestCount.toLocaleString()} requests
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {endpoint.description}
                </p>

                {selectedEndpoint === endpoint.id && (
                  <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      Example Request
                    </h4>
                    <pre className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-x-auto">
                      <code className="text-xs font-mono text-neutral-700 dark:text-neutral-300">
                        {`curl -X ${endpoint.method} \\
  https://api.craft.tech${endpoint.path} \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                      </code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Documentation Link */}
          <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              API Documentation
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
              View complete API documentation with examples and response schemas
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              View Documentation
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
