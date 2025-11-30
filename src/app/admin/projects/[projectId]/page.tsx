/**
 * Admin Project Debug Page
 *
 * Full visibility into a project's chat history, AI usage, and agent sessions
 * Helps admins debug issues and assist users who are stuck
 */

"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  User,
  Bot,
  Cpu,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Wrench,
  Copy,
  ExternalLink,
  Zap,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  toolCalls?: unknown;
  fileChanges?: unknown;
}

interface AgentSession {
  id: string;
  status: string;
  messageCount: number;
  createdAt: string;
  lastActive: string;
  totalTokens?: number;
  totalCost?: number;
}

interface AIUsageRecord {
  id: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  providerCostUsd: number;
  callType: string;
  createdAt: string;
}

interface Task {
  id: string;
  phase: string;
  description: string;
  status: string;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface ProjectDebugData {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    version: number;
    sandboxId: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
  chatMessages: ChatMessage[];
  agentSessions: AgentSession[];
  aiUsage: AIUsageRecord[];
  tasks: Task[];
  stats: {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    totalAiCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    avgTokensPerMessage: number;
    avgCostPerMessage: number;
  };
}

export default function AdminProjectDebugPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ProjectDebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set()
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/debug`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        toast.error(result.error || "Failed to fetch project data");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to fetch project data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleMessage = (id: string) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTask = (id: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-neutral-400" />
        <p className="text-neutral-500">Project not found</p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="rounded-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {data.project.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <User className="h-4 w-4" />
              {data.project.user.name || data.project.user.email}
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <Badge variant="outline" className="rounded-full">
                {data.project.status}
              </Badge>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>v
              {data.project.version}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild className="rounded-full">
            <a
              href={`/agent/${projectId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Project
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <MessageSquare className="h-4 w-4" />
              Messages
            </div>
            <div className="text-2xl font-bold">{data.stats.totalMessages}</div>
            <div className="text-xs text-neutral-500">
              {data.stats.userMessages} user / {data.stats.assistantMessages} AI
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <Cpu className="h-4 w-4" />
              AI Calls
            </div>
            <div className="text-2xl font-bold">{data.stats.totalAiCalls}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <Zap className="h-4 w-4" />
              Input Tokens
            </div>
            <div className="text-2xl font-bold">
              {(data.stats.totalInputTokens / 1000).toFixed(1)}K
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <Zap className="h-4 w-4" />
              Output Tokens
            </div>
            <div className="text-2xl font-bold">
              {(data.stats.totalOutputTokens / 1000).toFixed(1)}K
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </div>
            <div className="text-2xl font-bold">
              ${data.stats.totalCost.toFixed(4)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <Activity className="h-4 w-4" />
              Avg/Message
            </div>
            <div className="text-2xl font-bold">
              ${data.stats.avgCostPerMessage.toFixed(4)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="rounded-full">
          <TabsTrigger value="chat" className="rounded-full">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat History
          </TabsTrigger>
          <TabsTrigger value="sessions" className="rounded-full">
            <Activity className="h-4 w-4 mr-2" />
            Agent Sessions
          </TabsTrigger>
          <TabsTrigger value="usage" className="rounded-full">
            <Cpu className="h-4 w-4 mr-2" />
            AI Usage
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-full">
            <Wrench className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
        </TabsList>

        {/* Chat History Tab */}
        <TabsContent value="chat">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Full Chat History</CardTitle>
              <CardDescription>
                All messages in this project, most recent first
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {data.chatMessages.map((message) => {
                    const isExpanded = expandedMessages.has(message.id);
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "rounded-xl p-4 border",
                          message.role === "user"
                            ? "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                            : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {message.role === "user" ? (
                              <User className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Bot className="h-4 w-4 text-purple-500" />
                            )}
                            <Badge
                              variant={
                                message.role === "user"
                                  ? "default"
                                  : "secondary"
                              }
                              className="rounded-full"
                            >
                              {message.role}
                            </Badge>
                            <span className="text-xs text-neutral-500">
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full h-7 w-7 p-0"
                              onClick={() => copyToClipboard(message.content)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full h-7 w-7 p-0"
                              onClick={() => toggleMessage(message.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Preview or full content */}
                        {!isExpanded ? (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
                            {message.content.slice(0, 300)}
                            {message.content.length > 300 && "..."}
                          </p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <pre className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-mono bg-neutral-100 dark:bg-neutral-900 rounded-lg p-3 max-h-[400px] overflow-y-auto">
                              {message.content}
                            </pre>
                            {message.toolCalls ? (
                              <div className="mt-2">
                                <p className="text-xs text-neutral-500 mb-1">
                                  Tool Calls:
                                </p>
                                <pre className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 rounded p-2 overflow-x-auto">
                                  {JSON.stringify(message.toolCalls, null, 2)}
                                </pre>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Sessions Tab */}
        <TabsContent value="sessions">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Agent Sessions</CardTitle>
              <CardDescription>
                AI agent orchestration sessions for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.agentSessions.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  No agent sessions found
                </div>
              ) : (
                <div className="space-y-4">
                  {data.agentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "rounded-full",
                              session.status === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : session.status === "active"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : session.status === "failed"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                            )}
                          >
                            {session.status}
                          </Badge>
                          <span className="text-sm text-neutral-500">
                            {session.messageCount} messages
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500">
                          {new Date(session.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-neutral-500">Session ID:</span>
                          <span className="ml-2 font-mono text-xs">
                            {session.id.slice(0, 12)}...
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Last Active:</span>
                          <span className="ml-2">
                            {new Date(session.lastActive).toLocaleString()}
                          </span>
                        </div>
                        {session.totalCost !== undefined && (
                          <div>
                            <span className="text-neutral-500">Cost:</span>
                            <span className="ml-2">
                              ${session.totalCost.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Usage Tab */}
        <TabsContent value="usage">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>AI Usage Details</CardTitle>
              <CardDescription>
                Detailed breakdown of AI API calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      <th className="text-left py-2 px-3 font-medium text-neutral-500">
                        Time
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-neutral-500">
                        Model
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-neutral-500">
                        Type
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-neutral-500">
                        Input
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-neutral-500">
                        Output
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-neutral-500">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.aiUsage.map((usage) => (
                      <tr
                        key={usage.id}
                        className="border-b border-neutral-100 dark:border-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                      >
                        <td className="py-2 px-3 text-neutral-500">
                          {new Date(usage.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          <Badge
                            variant="outline"
                            className="rounded-full font-mono text-xs"
                          >
                            {usage.model}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 capitalize">
                          {usage.callType}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {usage.inputTokens.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {usage.outputTokens.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          ${usage.providerCostUsd.toFixed(6)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Agent Tasks</CardTitle>
              <CardDescription>Task execution history</CardDescription>
            </CardHeader>
            <CardContent>
              {data.tasks.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  No tasks found
                </div>
              ) : (
                <div className="space-y-3">
                  {data.tasks.map((task) => {
                    const isExpanded = expandedTasks.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4"
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleTask(task.id)}
                        >
                          <div className="flex items-center gap-2">
                            {task.status === "completed" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : task.status === "failed" ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                            <Badge variant="outline" className="rounded-full">
                              {task.phase}
                            </Badge>
                            <Badge
                              className={cn(
                                "rounded-full",
                                task.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : task.status === "failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              )}
                            >
                              {task.status}
                            </Badge>
                            <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate max-w-[300px]">
                              {task.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">
                              {new Date(task.createdAt).toLocaleString()}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="mt-4 space-y-3">
                            <div>
                              <p className="text-xs text-neutral-500 mb-1">
                                Description:
                              </p>
                              <p className="text-sm">{task.description}</p>
                            </div>
                            {task.result && (
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">
                                  Result:
                                </p>
                                <pre className="text-xs bg-neutral-100 dark:bg-neutral-900 rounded p-2 overflow-x-auto max-h-[200px] overflow-y-auto">
                                  {JSON.stringify(task.result, null, 2)}
                                </pre>
                              </div>
                            )}
                            {task.errorMessage && (
                              <div>
                                <p className="text-xs text-red-500 mb-1">
                                  Error:
                                </p>
                                <pre className="text-xs bg-red-50 dark:bg-red-950 text-red-600 rounded p-2">
                                  {task.errorMessage}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
