"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Loader2, XCircle, Zap } from "lucide-react";

interface TaskInfo {
  id: string;
  phase: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "failed";
}

interface OrchestratorProgressProps {
  tasks: TaskInfo[];
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  percentComplete: number;
  currentTaskId?: string;
  isActive: boolean;
}

export function OrchestratorProgress({
  tasks,
  totalTasks,
  completedTasks,
  failedTasks,
  percentComplete,
  currentTaskId,
  isActive,
}: OrchestratorProgressProps) {
  const [expandedTasks, setExpandedTasks] = useState(true);

  // Auto-collapse if many tasks
  useEffect(() => {
    if (tasks.length > 10) {
      setExpandedTasks(false);
    }
  }, [tasks.length]);

  const getPhaseIcon = (phase: string) => {
    const icons: Record<string, string> = {
      setup: "🔧",
      initialize: "🚀",
      implement: "💻",
      build: "🔨",
      preview: "👁️",
    };
    return icons[phase] || "📋";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
        );
      case "in-progress":
        return (
          <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
        );
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Circle className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800";
      default:
        return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700";
    }
  };

  if (!isActive && tasks.length === 0) {
    return null;
  }

  return (
    <Card className="border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-base font-semibold">
              Multi-Agent Orchestration
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className={`rounded-full ${
              isActive
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900"
                : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
            }`}
          >
            {isActive ? "Active" : "Completed"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              Overall Progress
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {completedTasks}/{totalTasks} tasks ({percentComplete}%)
            </span>
          </div>
          <Progress
            value={percentComplete}
            className="h-2 bg-neutral-200 dark:bg-neutral-800"
          />
          {failedTasks > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {failedTasks} task{failedTasks !== 1 ? "s" : ""} failed
            </p>
          )}
        </div>

        {/* Task List */}
        {tasks.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setExpandedTasks(!expandedTasks)}
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              {expandedTasks ? "Hide" : "Show"} Tasks ({tasks.length})
            </button>

            {expandedTasks && (
              <div className="space-y-2 mt-2">
                {tasks.map((task, index) => {
                  const isCurrentTask = task.id === currentTaskId;

                  return (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        isCurrentTask
                          ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                          : "bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800"
                      } transition-colors`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(task.status)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg" aria-label={task.phase}>
                            {getPhaseIcon(task.phase)}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs rounded-full ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </Badge>
                        </div>

                        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {task.description}
                        </p>
                      </div>

                      <div className="flex-shrink-0 text-xs text-neutral-500 dark:text-neutral-500">
                        {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
