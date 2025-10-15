"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
} from "lucide-react";

interface CodeEditorProps {
  projectId: string;
  projectFiles?: Record<string, string>;
  streamingFiles?: Record<string, string>;
  isGenerating?: boolean;
  onFileClick?: (path: string) => void;
}

interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
  isNew?: boolean;
  isStreaming?: boolean;
  expanded?: boolean;
}

export default function CodeEditor({
  projectId,
  projectFiles = {},
  streamingFiles = {},
  isGenerating = false,
  onFileClick,
}: CodeEditorProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(true);
  const [files, setFiles] = useState<Record<string, string>>(projectFiles);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [currentStreamingFile, setCurrentStreamingFile] = useState<
    string | null
  >(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Track which file is currently being streamed (most recent)
  useEffect(() => {
    if (isGenerating && Object.keys(streamingFiles).length > 0) {
      const fileKeys = Object.keys(streamingFiles);
      const latestFile = fileKeys[fileKeys.length - 1];
      setCurrentStreamingFile(latestFile);
    } else {
      setCurrentStreamingFile(null);
    }
  }, [streamingFiles, isGenerating]);

  // Load files from API on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const response = await fetch(`/api/files?projectId=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          const loadedFiles = data.codeFiles || data.files || {};
          setFiles(loadedFiles);

          // Auto-expand folders that have files
          const folders = new Set<string>();
          Object.keys(loadedFiles).forEach((path) => {
            const parts = path.split("/");
            for (let i = 0; i < parts.length - 1; i++) {
              folders.add(parts.slice(0, i + 1).join("/"));
            }
          });
          setExpandedFolders(folders);
        }
      } catch (error) {
        console.error("Error loading files:", error);
      }
    };

    loadFiles();
  }, [projectId]);

  // Auto-switch to streaming file and update code in real-time
  useEffect(() => {
    if (isGenerating && currentStreamingFile) {
      setSelectedFile(currentStreamingFile);
      setFiles((prev) => ({ ...prev, ...streamingFiles }));

      // Auto-expand folders for streaming file
      const parts = currentStreamingFile.split("/");
      const newFolders = new Set(expandedFolders);
      for (let i = 0; i < parts.length - 1; i++) {
        newFolders.add(parts.slice(0, i + 1).join("/"));
      }
      setExpandedFolders(newFolders);
    }
  }, [currentStreamingFile, isGenerating, streamingFiles, expandedFolders]);

  // Update code when selected file or files change
  useEffect(() => {
    if (selectedFile && files[selectedFile] !== undefined) {
      setCode(files[selectedFile]);
      
      // Auto-scroll to bottom during streaming
      if (isGenerating && selectedFile === currentStreamingFile) {
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.scrollTop = editorRef.current.scrollHeight;
          }
        }, 50);
      }
    }
  }, [selectedFile, files, isGenerating, currentStreamingFile]);

  // Update files when projectFiles prop changes
  useEffect(() => {
    if (!isGenerating && Object.keys(projectFiles).length > 0) {
      setFiles((prevFiles) => ({ ...prevFiles, ...projectFiles }));
    }
  }, [projectFiles, isGenerating]);

  // Build hierarchical file tree
  const buildFileTree = (filePaths: string[]): FileNode[] => {
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
          const isNewFile =
            isFile &&
            streamingFiles[fullPath] !== undefined &&
            projectFiles[fullPath] === undefined;
          const isStreamingFile = isFile && fullPath === currentStreamingFile;

          const newNode: FileNode = {
            name: part,
            type: isFile ? "file" : "folder",
            path: fullPath,
            children: isFile ? undefined : [],
            isNew: isNewFile,
            isStreaming: isStreamingFile,
            expanded: expandedFolders.has(fullPath),
          };

          currentLevel.push(newNode);
          if (!isFile && newNode.children) {
            currentLevel = newNode.children;
          }
        }
      });
    });

    // Sort: folders first, then files, alphabetically
    const sortNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    };

    const sortRecursive = (nodes: FileNode[]): FileNode[] => {
      const sorted = sortNodes(nodes);
      sorted.forEach((node) => {
        if (node.children) {
          node.children = sortRecursive(node.children);
        }
      });
      return sorted;
    };

    return sortRecursive(root);
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleFileSelect = (path: string) => {
    setSelectedFile(path);
    onFileClick?.(path);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const iconClass = "w-4 h-4";

    // Color-coded by file type
    const colors: Record<string, string> = {
      tsx: "text-blue-500",
      jsx: "text-blue-400",
      ts: "text-blue-600",
      js: "text-yellow-500",
      json: "text-yellow-600",
      css: "text-purple-500",
      html: "text-orange-500",
      md: "text-neutral-500",
      env: "text-green-600",
    };

    const color = colors[ext || ""] || "text-neutral-400";

    return <FileCode className={`${iconClass} ${color}`} />;
  };

  const renderFileTree = (nodes: FileNode[], level = 0): React.ReactNode[] => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedFile === node.path;

      return (
        <div key={node.path}>
          <button
            onClick={() => {
              if (node.type === "folder") {
                toggleFolder(node.path);
              } else {
                handleFileSelect(node.path);
              }
            }}
            className={`
              w-full flex items-center gap-1.5 px-2 py-1 text-sm transition-colors
              hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg
              ${isSelected ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" : "text-neutral-700 dark:text-neutral-300"}
              ${node.isNew ? "bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500" : ""}
              ${node.isStreaming ? "animate-pulse" : ""}
            `}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            {node.type === "folder" ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
                ) : (
                  <Folder className="w-4 h-4 flex-shrink-0 text-neutral-600 dark:text-neutral-400" />
                )}
              </>
            ) : (
              <>
                <span className="w-3 h-3 flex-shrink-0" /> {/* Spacer */}
                {getFileIcon(node.name)}
              </>
            )}
            <span className="truncate flex-1 text-left">{node.name}</span>
            {node.isNew && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500 text-white font-medium">
                NEW
              </span>
            )}
            {node.isStreaming && (
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" />
                <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              </span>
            )}
          </button>
          {node.type === "folder" &&
            isExpanded &&
            node.children &&
            renderFileTree(node.children, level + 1)}
        </div>
      );
    });
  };

  const fileTree = buildFileTree(Object.keys(files));

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
      }
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Generation Status Banner */}
      {isGenerating && currentStreamingFile && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200 dark:border-green-800 px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce [animation-delay:0.3s]" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-green-900 dark:text-green-100">
              Generating code
            </span>
            <span className="text-xs text-green-700 dark:text-green-300 ml-2">
              {currentStreamingFile}
            </span>
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        {isFileTreeOpen && (
          <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-neutral-50 dark:bg-neutral-900/50">
            <div className="h-11 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-3 bg-white dark:bg-neutral-900">
              <h3 className="text-xs font-bold tracking-wide text-neutral-700 dark:text-neutral-300 uppercase">
                Explorer
              </h3>
              <button
                onClick={() => setIsFileTreeOpen(false)}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title="Close Sidebar"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {fileTree.length > 0 ? (
                renderFileTree(fileTree)
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    No files yet
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Code Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Editor Toolbar */}
          <div className="h-11 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 bg-white dark:bg-neutral-900">
            <div className="flex items-center gap-3">
              {!isFileTreeOpen && (
                <button
                  onClick={() => setIsFileTreeOpen(true)}
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Open Sidebar"
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
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile)}
                  <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
                    {selectedFile}
                  </span>
                  {currentStreamingFile === selectedFile && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500 text-white font-medium">
                      <span className="w-1 h-1 bg-white rounded-full animate-ping" />
                      LIVE
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!selectedFile}
                className="px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 overflow-hidden relative">
            {selectedFile ? (
              <textarea
                ref={editorRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Start coding..."
                readOnly={isGenerating && selectedFile === currentStreamingFile}
                className="w-full h-full p-4 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-sm leading-relaxed focus:outline-none resize-none"
                style={{
                  tabSize: 2,
                  lineHeight: "1.6",
                }}
                spellCheck={false}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center">
                    <FileCode className="w-10 h-10 text-neutral-400 dark:text-neutral-600" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    No file selected
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Choose a file from the explorer to view and edit its
                    contents
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
