"use client";

import { useState, useEffect } from "react";

interface CodeEditorProps {
  projectId: string;
  projectFiles?: Record<string, string>;
  streamingFiles?: Record<string, string>; // Files being generated in real-time
  isGenerating?: boolean; // Is AI currently generating files
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
  isNew?: boolean; // Highlight newly created files
}

export default function CodeEditor({
  projectId,
  projectFiles = {},
  streamingFiles = {},
  isGenerating = false,
}: CodeEditorProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(true);
  const [files, setFiles] = useState<Record<string, string>>(projectFiles);
  const [newFiles, setNewFiles] = useState<Set<string>>(new Set()); // Track newly created files

  // Load files from API on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const response = await fetch(`/api/files?projectId=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setFiles(data.codeFiles || data.files || {});
        }
      } catch (error) {
        console.error("Error loading files:", error);
      }
    };

    loadFiles();
  }, [projectId]);

  // Merge streaming files with project files for real-time display
  useEffect(() => {
    if (isGenerating && Object.keys(streamingFiles).length > 0) {
      // Merge streaming files
      setFiles((prevFiles) => ({ ...prevFiles, ...streamingFiles }));

      // Track new files
      const newFilesList = Object.keys(streamingFiles).filter(
        (path) => !projectFiles[path]
      );
      setNewFiles(new Set(newFilesList));

      // Auto-select the first streaming file if none selected
      if (!selectedFile && Object.keys(streamingFiles).length > 0) {
        const firstFile = Object.keys(streamingFiles)[0];
        setSelectedFile(firstFile);
      }
    } else {
      // Clear new files marker when generation completes
      setNewFiles(new Set());
    }
  }, [streamingFiles, isGenerating, projectFiles, selectedFile]);

  // Update files when projectFiles prop changes
  useEffect(() => {
    if (Object.keys(projectFiles).length > 0) {
      setFiles((prevFiles) => ({ ...prevFiles, ...projectFiles }));
    }
  }, [projectFiles]);

  // Update code when selected file changes
  useEffect(() => {
    if (selectedFile && files[selectedFile]) {
      setCode(files[selectedFile]);
    } else {
      setCode("");
    }
  }, [selectedFile, files]);

  // Build file tree from flat file paths
  const buildFileTree = (
    filePaths: string[],
    newFilesList: Set<string>
  ): FileNode[] => {
    const root: FileNode[] = [];

    filePaths.forEach((path) => {
      const parts = path.split("/");
      let currentLevel = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const existingNode = currentLevel.find((n) => n.name === part);

        if (existingNode) {
          if (!isFile && existingNode.children) {
            currentLevel = existingNode.children;
          }
        } else {
          const fullPath = parts.slice(0, index + 1).join("/");
          const newNode: FileNode = {
            name: part,
            type: isFile ? "file" : "folder",
            path: fullPath,
            children: isFile ? undefined : [],
            isNew: isFile && newFilesList.has(fullPath), // Mark new files being streamed
          };

          currentLevel.push(newNode);
          if (!isFile && newNode.children) {
            currentLevel = newNode.children;
          }
        }
      });
    });

    return root;
  };

  const fileTree = buildFileTree(Object.keys(files), newFiles);

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node, index) => (
      <div
        key={`${node.path}-${index}`}
        style={{ paddingLeft: `${level * 12}px` }}
      >
        <button
          onClick={() => {
            if (node.type === "file") {
              setSelectedFile(node.path);
            }
          }}
          className={`w-full flex items-center gap-2 px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors ${
            selectedFile === node.path
              ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              : "text-neutral-700 dark:text-neutral-300"
          } ${
            node.isNew
              ? "animate-pulse bg-green-100 dark:bg-green-900/30 border-l-2 border-green-500"
              : ""
          }`}
        >
          <span className="text-base">
            {node.type === "folder" ? "📁" : "📄"}
          </span>
          <span className="truncate">{node.name}</span>
          {node.isNew && (
            <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium">
              NEW
            </span>
          )}
        </button>
        {node.children && renderFileTree(node.children, level + 1)}
      </div>
    ));
  };

  // Save file handler
  const handleSave = async () => {
    if (!selectedFile) return;

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          filePath: selectedFile,
          content: code,
        }),
      });

      if (response.ok) {
        setFiles((prev) => ({ ...prev, [selectedFile]: code }));
        // TODO: Show success message
      }
    } catch (error) {
      console.error("Error saving file:", error);
      // TODO: Show error message
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Generation Status Banner */}
      {isGenerating && Object.keys(streamingFiles).length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-2 flex items-center gap-3">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Generating {Object.keys(streamingFiles).length} file
            {Object.keys(streamingFiles).length !== 1 ? "s" : ""}...
          </span>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
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
              <button
                onClick={handleSave}
                className="px-3 py-1 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full hover:opacity-80 transition-opacity"
              >
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
    </div>
  );
}
