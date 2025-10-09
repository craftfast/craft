"use client";

import { useState } from "react";

interface DatabasePanelProps {
  projectId: string;
}

interface Table {
  name: string;
  rowCount: number;
}

export default function DatabasePanel({ projectId }: DatabasePanelProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock tables
  const tables: Table[] = [
    { name: "users", rowCount: 142 },
    { name: "projects", rowCount: 89 },
    { name: "sessions", rowCount: 256 },
    { name: "analytics", rowCount: 1024 },
  ];

  // Mock data for selected table
  const mockData = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      createdAt: "2025-01-15",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      createdAt: "2025-01-16",
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      createdAt: "2025-01-17",
    },
  ];

  return (
    <div className="h-full flex bg-white dark:bg-neutral-900">
      {/* Tables Sidebar */}
      <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="h-10 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-3">
          <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            TABLES
          </h3>
          <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {tables.map((table) => (
            <button
              key={table.name}
              onClick={() => setSelectedTable(table.name)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                selectedTable === table.name
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🗄️</span>
                <span className="font-medium">{table.name}</span>
              </div>
              <span className="text-xs opacity-60">{table.rowCount}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Data Viewer */}
      <div className="flex-1 flex flex-col">
        {selectedTable ? (
          <>
            {/* Toolbar */}
            <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedTable}
                </h2>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  Export
                </button>
                <button className="px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:opacity-80 transition-opacity">
                  Add Row
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Created At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">
                        {row.id}
                      </td>
                      <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                        {row.email}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                        {row.createdAt}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <span className="text-2xl">🗄️</span>
              </div>
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                No Table Selected
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Select a table from the sidebar to view data
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
