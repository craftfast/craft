"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import ChatPanel from "./coding-interface/ChatPanel";
import PreviewPanel from "./coding-interface/PreviewPanel";
import CodeEditor from "./coding-interface/CodeEditor";
import DatabasePanel from "./coding-interface/DatabasePanel";
import AnalyticsPanel from "./coding-interface/AnalyticsPanel";
import DomainsPanel from "./coding-interface/DomainsPanel";
import LogsPanel from "./coding-interface/LogsPanel";
import ApiPanel from "./coding-interface/ApiPanel";
import SettingsPanel from "./coding-interface/SettingsPanel";
import AuthPanel from "./coding-interface/AuthPanel";

type TabType =
  | "preview"
  | "code"
  | "database"
  | "analytics"
  | "domains"
  | "logs"
  | "api"
  | "settings"
  | "auth";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface CodingInterfaceProps {
  project: Project;
  user: User;
}

export default function CodingInterface({
  project,
  user,
}: CodingInterfaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const chatWidth = 30; // Fixed at 30%

  const tabs = [
    {
      id: "preview" as const,
      label: "Preview",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
    },
    {
      id: "code" as const,
      label: "Code",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
    },
    {
      id: "database" as const,
      label: "Database",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
    },
    {
      id: "analytics" as const,
      label: "Analytics",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: "domains" as const,
      label: "Domains",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      ),
    },
    {
      id: "logs" as const,
      label: "Logs",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: "api" as const,
      label: "API",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "settings" as const,
      label: "Settings",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: "auth" as const,
      label: "Auth",
      svg: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="h-14 bg-white dark:bg-neutral-900 flex items-center px-4 flex-shrink-0">
        {/* Main Menu Area - 30/70 Split */}
        <div className="flex items-center flex-1 min-w-0">
          {/* Left section - Logo, Project Name & Chat Options (30%) */}
          <div
            className="flex items-center gap-4 pr-2 transition-all duration-200"
            style={{ width: isChatCollapsed ? "auto" : `${chatWidth}%` }}
          >
            {/* Logo and Project Name */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => router.push("/dashboard")}
                className="hover:opacity-70 transition-opacity flex-shrink-0"
              >
                <Logo
                  showText={false}
                  iconClassName="text-neutral-900 dark:text-neutral-100"
                />
              </button>
              <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            {/* Chat Options */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isChatCollapsed ? (
                <>
                  {/* History Button */}
                  <button
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                    title="History"
                  >
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>

                  {/* Chat Toggle Button */}
                  <button
                    onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors"
                    title="Hide chat"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {/* Show Chat Button when collapsed */}
                  <button
                    onClick={() => setIsChatCollapsed(false)}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors"
                    title="Show chat"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right section - All Other Menu Options (70%) */}
          <div className="flex items-center gap-2 flex-1 pl-2">
            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                  }`}
                  title={tab.label}
                >
                  {tab.svg}
                  {activeTab === tab.id && (
                    <span className="text-xs font-medium">{tab.label}</span>
                  )}
                </button>
              ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Deploy Button */}
            <button className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-600 transition-colors flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="hidden sm:inline">Deploy</span>
            </button>

            {/* Share Button */}
            <button className="px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* User Profile Menu */}
            {user && <UserMenu user={user} showDashboardLink={true} />}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - Left Side */}
        {!isChatCollapsed && (
          <div
            className="bg-white dark:bg-neutral-900 flex flex-col overflow-hidden"
            style={{ width: `${chatWidth}%` }}
          >
            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <ChatPanel projectId={project.id} />
            </div>
          </div>
        )}

        {/* Right Side - Content Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900 px-2 pb-2">
          {/* Main Panel */}
          <main className="flex-1 overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
            {activeTab === "preview" && <PreviewPanel projectId={project.id} />}
            {activeTab === "code" && <CodeEditor projectId={project.id} />}
            {activeTab === "database" && (
              <DatabasePanel projectId={project.id} />
            )}
            {activeTab === "analytics" && (
              <AnalyticsPanel projectId={project.id} />
            )}
            {activeTab === "domains" && <DomainsPanel projectId={project.id} />}
            {activeTab === "logs" && <LogsPanel projectId={project.id} />}
            {activeTab === "api" && <ApiPanel projectId={project.id} />}
            {activeTab === "settings" && (
              <SettingsPanel projectId={project.id} />
            )}
            {activeTab === "auth" && <AuthPanel projectId={project.id} />}
          </main>
        </div>
      </div>
    </div>
  );
}
