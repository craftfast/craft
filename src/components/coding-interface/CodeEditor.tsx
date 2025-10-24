"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  Copy,
  Download,
  Check,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { githubDark } from "@uiw/codemirror-theme-github";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

interface CodeEditorProps {
  projectId: string;
  projectFiles?: Record<string, string>;
  streamingFiles?: Record<string, string>;
  isGenerating?: boolean;
  onFileClick?: (path: string) => void;
  selectedFileFromChat?: string | null;
  onFileSelected?: () => void;
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
  selectedFileFromChat,
  onFileSelected,
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
  const [changeCount, setChangeCount] = useState(0);
  const [newFileCount, setNewFileCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to copy code to clipboard
  const handleCopyCode = async () => {
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy code:", error);
      }
    }
  };

  // Helper function to download file
  const handleDownloadFile = () => {
    if (selectedFile && code) {
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = selectedFile.split("/").pop() || "file.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Helper function to get language extension based on file type
  const getLanguageExtension = (filename: string): Extension[] => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return [javascript({ jsx: true, typescript: true })];
      case "css":
        return [css()];
      case "html":
        return [html()];
      case "json":
        return [json()];
      case "md":
        return [markdown()];
      default:
        return [];
    }
  };

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

  // Track changes and new files
  useEffect(() => {
    if (isGenerating) {
      const streamingKeys = Object.keys(streamingFiles);
      const newFiles = streamingKeys.filter(
        (path) => !projectFiles[path]
      ).length;
      setNewFileCount(newFiles);
      setChangeCount(streamingKeys.length);
    } else {
      setChangeCount(0);
      setNewFileCount(0);
    }
  }, [streamingFiles, projectFiles, isGenerating]);

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

      // Auto-expand folders for streaming file
      const parts = currentStreamingFile.split("/");
      const newFolders = new Set(expandedFolders);
      let hasChanges = false;
      for (let i = 0; i < parts.length - 1; i++) {
        const folder = parts.slice(0, i + 1).join("/");
        if (!newFolders.has(folder)) {
          newFolders.add(folder);
          hasChanges = true;
        }
      }
      if (hasChanges) {
        setExpandedFolders(newFolders);
      }
    }
  }, [currentStreamingFile, isGenerating, expandedFolders]);

  // Merge streaming files into files state (separate effect to avoid loops)
  useEffect(() => {
    if (isGenerating && Object.keys(streamingFiles).length > 0) {
      setFiles((prev) => {
        // Only update if there are actual changes
        const hasChanges = Object.keys(streamingFiles).some(
          (key) => streamingFiles[key] !== prev[key]
        );
        if (!hasChanges) return prev;
        return { ...prev, ...streamingFiles };
      });
    }
  }, [streamingFiles, isGenerating]);

  // Update code when selected file or files change
  useEffect(() => {
    if (selectedFile) {
      // During streaming, prioritize streamingFiles for real-time updates
      const content =
        isGenerating && streamingFiles[selectedFile] !== undefined
          ? streamingFiles[selectedFile]
          : files[selectedFile];

      if (content !== undefined) {
        setCode(content);

        // Auto-scroll to bottom during streaming
        if (isGenerating && selectedFile === currentStreamingFile) {
          setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop =
                scrollContainerRef.current.scrollHeight;
            }
          }, 50);
        }
      }
    }
  }, [selectedFile, files, streamingFiles, isGenerating, currentStreamingFile]);

  // Handle file selection from chat panel
  useEffect(() => {
    if (selectedFileFromChat) {
      // Check if file exists in current files or streaming files
      const allFiles = { ...files, ...streamingFiles };
      if (allFiles[selectedFileFromChat]) {
        setSelectedFile(selectedFileFromChat);
        // Expand folders in the path
        const pathParts = selectedFileFromChat.split("/");
        const newExpandedFolders = new Set(expandedFolders);
        let currentPath = "";
        for (let i = 0; i < pathParts.length - 1; i++) {
          currentPath += (currentPath ? "/" : "") + pathParts[i];
          newExpandedFolders.add(currentPath);
        }
        setExpandedFolders(newExpandedFolders);
        // Notify parent that file has been selected
        onFileSelected?.();
      }
    }
  }, [
    selectedFileFromChat,
    files,
    streamingFiles,
    expandedFolders,
    onFileSelected,
  ]);

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
              ${
                isSelected
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-700 dark:text-neutral-300"
              }
              ${node.isNew ? "bg-neutral-50 dark:bg-neutral-800/50" : ""}
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
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium">
                NEW
              </span>
            )}
            {node.isStreaming && (
              <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse" />
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

  // Build file tree with both saved and streaming files
  const allFilePaths = Array.from(
    new Set([...Object.keys(files), ...Object.keys(streamingFiles)])
  );
  const fileTree = buildFileTree(allFilePaths);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
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
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-minimal">
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
                    <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse" />
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isGenerating && (
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  {changeCount > 0 && (
                    <span className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      {changeCount} {changeCount === 1 ? "change" : "changes"}
                    </span>
                  )}
                  {newFileCount > 0 && (
                    <span className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      {newFileCount}{" "}
                      {newFileCount === 1 ? "new file" : "new files"}
                    </span>
                  )}
                </div>
              )}
              {selectedFile && code && (
                <>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors group"
                    title="Copy code"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-green-600 dark:text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100" />
                    )}
                  </button>
                  <button
                    onClick={handleDownloadFile}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors group"
                    title="Download file"
                  >
                    <Download className="w-4 h-4 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 overflow-hidden relative bg-white dark:bg-black">
            {selectedFile ? (
              <div
                ref={scrollContainerRef}
                className="w-full h-full overflow-auto scrollbar-minimal"
              >
                <CodeMirror
                  value={code}
                  height="100%"
                  theme={githubDark}
                  extensions={[
                    ...getLanguageExtension(selectedFile),
                    EditorView.lineWrapping,
                    EditorView.theme({
                      "&": {
                        backgroundColor: "#000000",
                      },
                      ".cm-gutters": {
                        backgroundColor: "#000000",
                        borderRight: "1px solid #404040",
                      },
                      ".cm-content": {
                        backgroundColor: "#000000",
                      },
                      ".cm-scroller": {
                        backgroundColor: "#000000",
                      },
                    }),
                  ]}
                  readOnly
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: false,
                    highlightActiveLine: false,
                    foldGutter: true,
                    dropCursor: false,
                    indentOnInput: false,
                    syntaxHighlighting: true,
                    bracketMatching: true,
                    closeBrackets: false,
                    autocompletion: false,
                    rectangularSelection: false,
                    crosshairCursor: false,
                    highlightSelectionMatches: false,
                    closeBracketsKeymap: false,
                    searchKeymap: false,
                    foldKeymap: true,
                    completionKeymap: false,
                    lintKeymap: false,
                  }}
                  style={{
                    fontSize: "0.875rem",
                    height: "100%",
                  }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-white dark:bg-black">
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
