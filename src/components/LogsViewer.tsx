"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, Search, RefreshCw, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LogsViewerProps {
  projectId: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  source?: string;
  metadata?: any;
}

export function LogsViewer({ projectId }: LogsViewerProps) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const isFetching = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
  }, [projectId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 10000); // Poll every 10s instead of 3s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, projectId]);

  const fetchLogs = async () => {
    // Prevent overlapping requests
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/logs?lines=30`); // Fetch only 30 lines
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      setLogs(data.logs || []);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warn":
        return "text-yellow-600 dark:text-yellow-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      case "debug":
        return "text-neutral-500";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Logs</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="rounded-full"
          >
            {autoRefresh ? "Auto Refresh On" : "Auto Refresh Off"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="rounded-full"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-full">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Display */}
      <div className="border rounded-xl dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-4 h-[500px] overflow-y-auto font-mono text-sm">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-500">No logs found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border-b dark:border-neutral-800 pb-2 last:border-0"
              >
                <div className="flex items-start gap-3">
                  <span className="text-neutral-500 text-xs whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`text-xs font-semibold uppercase ${getLevelColor(
                      log.level
                    )} w-16`}
                  >
                    {log.level}
                  </span>
                  <span className="flex-1 break-words">{log.message}</span>
                </div>
                {log.source && (
                  <div className="text-xs text-neutral-500 ml-32 mt-1">
                    Source: {log.source}
                  </div>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-neutral-500">
        <span>
          Showing {filteredLogs.length} of {logs.length} logs
        </span>
        <span>{autoRefresh && "Auto-refreshing every 3s"}</span>
      </div>
    </div>
  );
}
