"use client";

import type { CreditUsageData } from "./types";

interface UsageTabProps {
  creditUsageData: CreditUsageData | null;
  isLoadingUsage: boolean;
  selectedProject: string;
  setSelectedProject: (value: string) => void;
  selectedEndpoint: string;
  setSelectedEndpoint: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  updateUrlParams: (params: Record<string, string | number>) => void;
  resetFilters: () => void;
}

export default function UsageTab({
  creditUsageData,
  isLoadingUsage,
  selectedProject,
  setSelectedProject,
  selectedEndpoint,
  setSelectedEndpoint,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  currentPage,
  setCurrentPage,
  updateUrlParams,
  resetFilters,
}: UsageTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Credit Usage History
        </h3>
        <p className="text-sm text-muted-foreground">
          View detailed breakdown of credit consumption for each interaction
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 bg-muted/50 rounded-xl border border-input">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Project Filter */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedProject(value);
                setCurrentPage(1);
                updateUrlParams({ project: value, page: 1 });
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-white dark:bg-neutral-800 text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            >
              <option value="">All Projects</option>
              {creditUsageData?.filters?.projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              )) || null}
            </select>
          </div>

          {/* Endpoint Filter */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Type
            </label>
            <select
              value={selectedEndpoint}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedEndpoint(value);
                setCurrentPage(1);
                updateUrlParams({ endpoint: value, page: 1 });
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-white dark:bg-neutral-800 text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            >
              <option value="">All Types</option>
              {creditUsageData?.filters?.endpoints?.map((endpoint) => (
                <option key={endpoint} value={endpoint}>
                  {endpoint}
                </option>
              )) || null}
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-white dark:bg-neutral-800 text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-white dark:bg-neutral-800 text-foreground focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            />
          </div>
        </div>

        {/* Reset Filters Button */}
        {(selectedProject || selectedEndpoint || startDate || endDate) && (
          <button
            onClick={resetFilters}
            className="mt-3 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-white dark:bg-neutral-800 border border-input rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoadingUsage ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-50"></div>
        </div>
      ) : creditUsageData && creditUsageData.records.length > 0 ? (
        <>
          {/* Table */}
          <div className="border border-input rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent border-b border-input">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Credits Used
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {creditUsageData.records.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-foreground">
                        <div>
                          {new Date(record.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(record.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-muted-foreground">
                            {record.projectName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {record.model}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            record.callType === "agent"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : record.callType === "chat"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                          }`}
                        >
                          {record.callType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-foreground">
                        ${(record.creditsUsed ?? 0).toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * 10 + 1} to{" "}
              {Math.min(
                currentPage * 10,
                creditUsageData.pagination.totalCount
              )}{" "}
              of {creditUsageData.pagination.totalCount} records
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1);
                  setCurrentPage(newPage);
                  updateUrlParams({ page: newPage });
                }}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground bg-white dark:bg-neutral-800 border border-input rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from(
                  {
                    length: Math.min(5, creditUsageData.pagination.totalPages),
                  },
                  (_, i) => {
                    let pageNum;
                    if (creditUsageData.pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (
                      currentPage >=
                      creditUsageData.pagination.totalPages - 2
                    ) {
                      pageNum = creditUsageData.pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          updateUrlParams({ page: pageNum });
                        }}
                        className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? "bg-primary text-neutral-50 dark:text-neutral-900"
                            : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() => {
                  const newPage = Math.min(
                    creditUsageData.pagination.totalPages,
                    currentPage + 1
                  );
                  setCurrentPage(newPage);
                  updateUrlParams({ page: newPage });
                }}
                disabled={currentPage === creditUsageData.pagination.totalPages}
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground bg-white dark:bg-neutral-800 border border-input rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">
            No usage records found
          </div>
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            {selectedProject || selectedEndpoint || startDate || endDate
              ? "Try adjusting your filters"
              : "Start using the platform to see your credit usage here"}
          </p>
        </div>
      )}
    </div>
  );
}
