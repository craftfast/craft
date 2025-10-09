"use client";

import { useState } from "react";

interface CodeEditorProps {
  projectId: string;
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

export default function CodeEditor({ projectId }: CodeEditorProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(true);

  // Mock file tree structure
  const fileTree: FileNode[] = [
    {
      name: "src",
      type: "folder",
      children: [
        { name: "app.ts", type: "file" },
        { name: "config.ts", type: "file" },
        {
          name: "components",
          type: "folder",
          children: [
            { name: "Header.tsx", type: "file" },
            { name: "Footer.tsx", type: "file" },
          ],
        },
      ],
    },
    {
      name: "public",
      type: "folder",
      children: [{ name: "index.html", type: "file" }],
    },
    { name: "package.json", type: "file" },
    { name: "tsconfig.json", type: "file" },
  ];

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node, index) => (
      <div
        key={`${node.name}-${index}`}
        style={{ paddingLeft: `${level * 12}px` }}
      >
        <button
          onClick={() => {
            if (node.type === "file") {
              setSelectedFile(node.name);
            }
          }}
          className={`w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors ${
            selectedFile === node.name
              ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              : "text-neutral-700 dark:text-neutral-300"
          }`}
        >
          <span className="text-base">
            {node.type === "folder" ? "📁" : "📄"}
          </span>
          <span className="truncate">{node.name}</span>
        </button>
        {node.children && renderFileTree(node.children, level + 1)}
      </div>
    ));
  };

  return (
    <div className="h-full flex bg-white dark:bg-neutral-900">
      {/* File Tree Sidebar */}
      {isFileTreeOpen && (
        <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
          <div className="h-10 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-3">
            <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              FILES
            </h3>
            <button
              onClick={() => setIsFileTreeOpen(false)}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {renderFileTree(fileTree)}
          </div>
        </aside>
      )}

      {/* Code Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Toolbar */}
        <div className="h-10 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {!isFileTreeOpen && (
              <button
                onClick={() => setIsFileTreeOpen(true)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
            {selectedFile && (
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {selectedFile}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
              Format
            </button>
            <button className="px-3 py-1 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:opacity-80 transition-opacity">
              Save
            </button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 overflow-hidden">
          {selectedFile ? (
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Start coding..."
              className="w-full h-full p-4 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-sm focus:outline-none resize-none"
              spellCheck={false}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  No File Selected
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Select a file from the sidebar to start editing
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
