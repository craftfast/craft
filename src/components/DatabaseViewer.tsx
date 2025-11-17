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
import { Loader2, Database, Search, RefreshCw, Play } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface DatabaseViewerProps {
  projectId: string;
}

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
}

export function DatabaseViewer({ projectId }: DatabaseViewerProps) {
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, [projectId]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/projects/${projectId}/database/tables`
      );
      if (!response.ok) throw new Error("Failed to fetch tables");
      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/projects/${projectId}/database/query`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `SELECT * FROM ${tableName} LIMIT 100`,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to query table");
      const data = await response.json();
      setQueryResult(data.result);
      setSelectedTable(tableName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  };

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/projects/${projectId}/database/query`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: customQuery }),
        }
      );
      if (!response.ok) throw new Error("Query failed");
      const data = await response.json();
      setQueryResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Database Viewer</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTables}
          disabled={loading}
          className="rounded-full"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Tables List */}
      <div className="border rounded-xl p-4 dark:border-neutral-800">
        <h4 className="text-sm font-medium mb-3">Tables</h4>
        {loading && tables.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : tables.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4">No tables found</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {tables.map((table) => (
              <Button
                key={table}
                variant={selectedTable === table ? "default" : "outline"}
                size="sm"
                onClick={() => fetchTableData(table)}
                className="justify-start rounded-full"
              >
                {table}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Query */}
      <div className="border rounded-xl p-4 dark:border-neutral-800">
        <h4 className="text-sm font-medium mb-3">Custom Query</h4>
        <div className="space-y-2">
          <Textarea
            placeholder="SELECT * FROM table_name WHERE ..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            className="font-mono text-sm rounded-xl"
            rows={4}
          />
          <Button
            onClick={executeCustomQuery}
            disabled={loading || !customQuery.trim()}
            size="sm"
            className="rounded-full"
          >
            <Play className="h-4 w-4 mr-1" />
            Execute Query
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="border border-red-500 rounded-xl p-4 bg-red-50 dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Query Results */}
      {queryResult && (
        <div className="border rounded-xl p-4 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">
              Results ({queryResult.rowCount} rows)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {queryResult.columns.map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {queryResult.rows.map((row, idx) => (
                  <TableRow key={idx}>
                    {queryResult.columns.map((col) => (
                      <TableCell key={col}>{String(row[col] ?? "")}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
