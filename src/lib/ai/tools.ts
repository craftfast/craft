/**
 * AI Tools for File Operations and Commands
 * Enhanced Phase 1: Tool Use Implementation
 * 
 * These tools give the AI agent environment awareness and the ability to:
 * - Investigate project structure before acting
 * - Read and understand existing code
 * - Create/modify files with context
 * - Execute commands and validate results
 * - Search and analyze code patterns
 */

import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getToolContext } from "@/lib/ai/tool-context";
import { SSEStreamWriter } from "@/lib/ai/sse-events";
import {
    getOrCreateProjectSandbox,
    pauseSandbox,
    resumeSandbox,
    writeFileToSandbox,
    readFileFromSandbox,
    executeSandboxCommand,
} from "@/lib/e2b/sandbox-manager";

// ============================================================================
// CORE FILE OPERATIONS
// ============================================================================

export const listFiles = tool({
    description: 'List all files in the project with metadata. Use this to understand the project structure before making changes. ALWAYS use this at the start of a conversation to see what exists.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        path: z.string().optional().describe('Optional: specific directory path to list (e.g., "src/components")'),
    }),
    execute: async ({ projectId, path }) => {
        console.log(`📂 Listing files${path ? ` in ${path}` : ''} for project ${projectId}`);

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });

        if (!project) {
            return {
                success: false,
                error: 'Project not found',
                files: []
            };
        }

        const files = (project.codeFiles as Record<string, string>) || {};
        let fileList = Object.keys(files);

        // Filter by path if specified
        if (path) {
            const normalizedPath = path.endsWith('/') ? path : `${path}/`;
            fileList = fileList.filter(f => f.startsWith(normalizedPath));
        }

        // Add metadata
        const filesWithMetadata = fileList.map(filePath => {
            const content = files[filePath];
            const lines = content.split('\n').length;
            const size = content.length;
            const ext = filePath.split('.').pop() || '';

            return {
                path: filePath,
                size,
                lines,
                extension: ext,
                type: getFileType(ext),
            };
        });

        console.log(`✅ Found ${filesWithMetadata.length} files`);
        return {
            success: true,
            files: filesWithMetadata,
            total: filesWithMetadata.length,
        };
    },
});

export const readFile = tool({
    description: 'Read the complete content of a specific file. ALWAYS use this to understand existing code before modifying it. This prevents accidental overwrites and helps maintain code quality.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        path: z.string().describe('Full file path (e.g., "src/app/page.tsx")'),
    }),
    execute: async ({ projectId, path }) => {
        console.log(`📖 Reading file: ${path}`);

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });

        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        const files = (project.codeFiles as Record<string, string>) || {};
        const content = files[path];

        if (!content) {
            const availableFiles = Object.keys(files).slice(0, 10);
            return {
                success: false,
                error: `File not found: ${path}`,
                suggestion: `Available files include: ${availableFiles.join(', ')}`,
                availableFiles,
            };
        }

        console.log(`✅ Read ${path} (${content.length} chars, ${content.split('\n').length} lines)`);
        return {
            success: true,
            path,
            content,
            lines: content.split('\n').length,
            size: content.length,
        };
    },
});

export const generateFiles = tool({
    description: 'Create or update files in the E2B sandbox (source of truth). Files are written directly to sandbox with hot reload. After all changes are complete, use syncFilesToDB to persist to database. ALWAYS read existing files first to avoid overwriting important code. Provide complete file content, not partial updates. NOTE: For adding npm packages, use the installPackages tool instead of manually editing package.json.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        files: z.array(z.object({
            path: z.string().describe('Full file path (e.g., "src/components/Button.tsx")'),
            content: z.string().describe('Complete file content - must be valid, complete code'),
        })).describe('Array of files to create/update'),
        reason: z.string().optional().describe('Optional: explain why these files are being generated'),
    }),
    execute: async ({ projectId, files, reason }) => {
        console.log(`📝 Generating ${files.length} file(s) in sandbox${reason ? `: ${reason}` : ''}`);

        // Get tool context for SSE streaming
        const context = getToolContext();
        const sseWriter = context?.sseWriter;

        // Get sandbox ID from project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { sandboxId: true, codeFiles: true },
        });

        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        if (!project.sandboxId) {
            return {
                success: false,
                error: 'No active sandbox. Create sandbox first or use initializeNextApp.'
            };
        }

        const currentFiles = (project.codeFiles as Record<string, string>) || {};
        const changes: Array<{ path: string; action: 'created' | 'updated'; lines: number }> = [];

        // Write files directly to sandbox (source of truth!)
        for (const { path, content } of files) {
            const isNew = !currentFiles[path];
            const lines = content.split('\n').length;
            const language = path.split('.').pop() || 'txt';

            // ⚡ SSE: Emit file-stream-start event
            if (sseWriter) {
                sseWriter.writeFileStreamStart(path, {
                    language,
                    isNew,
                });
            }

            // ⚡ SSE: Stream content in chunks for large files (real-time feedback)
            if (sseWriter && content.length > 1000) {
                const chunkSize = 500; // Stream in 500-char chunks
                for (let i = 0; i < content.length; i += chunkSize) {
                    const chunk = content.slice(i, Math.min(i + chunkSize, content.length));
                    sseWriter.writeFileStreamDelta(path, chunk);

                    // Small delay to make streaming visible (optional)
                    await new Promise(resolve => setTimeout(resolve, 5));
                }
            }

            // Write to sandbox (source of truth!)
            await writeFileToSandbox(project.sandboxId, path, content);

            changes.push({ path, action: isNew ? 'created' : 'updated', lines });
            console.log(`  ${isNew ? '➕' : '✏️'} ${path} (${lines} lines) → sandbox`);

            // ⚡ SSE: Emit file-stream-complete event
            if (sseWriter) {
                sseWriter.writeFileStreamComplete(path, {
                    content,
                    language,
                    isNew,
                });
            }
        }

        return {
            success: true,
            filesCreated: changes.filter(c => c.action === 'created').length,
            filesUpdated: changes.filter(c => c.action === 'updated').length,
            changes,
            message: `Successfully wrote ${files.length} file(s) to sandbox. Use syncFilesToDB when done to persist changes.`,
        };
    },
});

export const deleteFile = tool({
    description: 'Delete a file from the project. Use with caution - this cannot be undone. Always explain why in the reason parameter.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        path: z.string().describe('Full file path to delete'),
        reason: z.string().optional().describe('Explanation for why this file is being deleted'),
    }),
    execute: async ({ projectId, path, reason }) => {
        console.log(`🗑️ Deleting file: ${path}${reason ? ` (${reason})` : ''}`);

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });

        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        const files = (project.codeFiles as Record<string, string>) || {};

        if (!files[path]) {
            return { success: false, error: `File not found: ${path}` };
        }

        delete files[path];

        await prisma.project.update({
            where: { id: projectId },
            data: { codeFiles: files, updatedAt: new Date() },
        });

        // Delete from E2B sandbox if active
        const sandboxData = activeSandboxes?.get(projectId);
        if (sandboxData?.sandbox) {
            try {
                await sandboxData.sandbox.files.remove(`/home/user/project/${path}`);
                console.log(`✅ Deleted from sandbox: ${path}`);
            } catch (error) {
                console.warn(`⚠️ Could not delete from sandbox: ${path}`);
            }
        }

        console.log(`✅ Deleted: ${path}`);
        return { success: true, path, message: `Deleted ${path}` };
    },
});

export const runCommand = tool({
    description: 'Execute a shell command in the E2B sandbox. Use for checking system state, running tests, or other shell operations. For package installation, use installPackages tool instead. Common commands: "ls -la", "cat package.json", "pnpm tsc --noEmit"',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        command: z.string().describe('Shell command to execute (do not include "cd /home/user/project" - it is automatic)'),
        reason: z.string().optional().describe('Optional: explain why this command is being run'),
    }),
    execute: async ({ projectId, command, reason }) => {
        console.log(`🔧 Running command: ${command}${reason ? ` (${reason})` : ''}`);

        const sandboxData = activeSandboxes?.get(projectId);

        if (!sandboxData?.sandbox) {
            return {
                success: false,
                error: 'No active sandbox. The sandbox may not be started yet.',
                exitCode: -1,
            };
        }

        try {
            const result = await sandboxData.sandbox.commands.run(
                `cd /home/user/project && ${command}`,
                { timeoutMs: 30000 } // 30 second timeout
            );

            const success = result.exitCode === 0;
            console.log(`${success ? '✅' : '❌'} Command ${success ? 'succeeded' : 'failed'} (exit code: ${result.exitCode})`);

            return {
                success,
                exitCode: result.exitCode,
                stdout: result.stdout || "",
                stderr: result.stderr || "",
                command,
            };
        } catch (error) {
            console.error('❌ Command execution error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                exitCode: -1,
                command,
            };
        }
    },
});

// ============================================================================
// ADVANCED TOOLS
// ============================================================================

export const getProjectStructure = tool({
    description: 'Get a complete hierarchical view of the project structure as a tree. Use this to understand the overall organization before making architectural changes or adding new features.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
    }),
    execute: async ({ projectId }) => {
        console.log(`🌳 Getting project structure for ${projectId}`);

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });

        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        const files = (project.codeFiles as Record<string, string>) || {};
        const filePaths = Object.keys(files);
        const structure = buildFileTree(filePaths);

        console.log(`✅ Built structure tree with ${filePaths.length} files`);
        return {
            success: true,
            structure,
            totalFiles: filePaths.length,
            tree: formatTree(structure), // Human-readable tree format
        };
    },
});

export const searchFiles = tool({
    description: 'Search for text or patterns across all files in the project. Useful for finding imports, function definitions, component usage, or specific code patterns. Case-insensitive by default.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        query: z.string().describe('Text or pattern to search for'),
        filePattern: z.string().optional().describe('Optional: file pattern to search in (e.g., "*.tsx", "src/**/*.ts")'),
        caseSensitive: z.boolean().optional().default(false).describe('Whether search is case-sensitive'),
    }),
    execute: async ({ projectId, query, filePattern, caseSensitive }) => {
        console.log(`🔍 Searching for "${query}"${filePattern ? ` in ${filePattern}` : ''}`);

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });

        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        const files = (project.codeFiles as Record<string, string>) || {};
        const results: Array<{
            file: string;
            line: number;
            content: string;
            match: string;
        }> = [];

        const searchQuery = caseSensitive ? query : query.toLowerCase();

        for (const [filePath, content] of Object.entries(files)) {
            // Apply file pattern filter
            if (filePattern && !matchFilePattern(filePath, filePattern)) {
                continue;
            }

            const lines = content.split('\n');
            lines.forEach((line, index) => {
                const searchLine = caseSensitive ? line : line.toLowerCase();
                if (searchLine.includes(searchQuery)) {
                    results.push({
                        file: filePath,
                        line: index + 1,
                        content: line.trim(),
                        match: query,
                    });
                }
            });
        }

        console.log(`✅ Found ${results.length} matches`);
        return {
            success: true,
            results: results.slice(0, 100), // Limit to first 100 matches
            totalMatches: results.length,
            query,
            truncated: results.length > 100,
        };
    },
});

export const installPackages = tool({
    description: 'Install npm packages using pnpm in the E2B sandbox. This tool: 1) Runs "pnpm add <packages>" in the sandbox, 2) Automatically fetches the updated package.json from sandbox, 3) Saves the updated package.json to the database. Use this tool whenever you need to add new dependencies - it handles everything in one step. Supports both dependencies and devDependencies.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        packages: z.array(z.string()).describe('Array of package names to install (e.g., ["react-query", "zod", "@types/node"])'),
        dev: z.boolean().optional().default(false).describe('Whether to install as devDependencies (use true for types, build tools, etc.)'),
    }),
    execute: async ({ projectId, packages, dev }) => {
        console.log(`📦 Installing ${packages.length} package(s): ${packages.join(', ')}${dev ? ' (dev)' : ''}`);

        const sandboxData = activeSandboxes?.get(projectId);

        if (!sandboxData?.sandbox) {
            return {
                success: false,
                error: 'No active sandbox',
            };
        }

        // Validate package names
        const validPackages = packages.filter(pkg => {
            const validPattern = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;
            return validPattern.test(pkg) && pkg.length <= 214;
        });

        if (validPackages.length === 0) {
            return {
                success: false,
                error: 'No valid package names provided',
            };
        }

        const flag = dev ? '-D' : '';
        const command = `pnpm add ${flag} ${validPackages.join(' ')}`.trim();

        try {
            const result = await sandboxData.sandbox.commands.run(
                `cd /home/user/project && ${command}`,
                { timeoutMs: 120000 } // 2 minute timeout for package installation
            );

            if (result.exitCode === 0) {
                console.log(`✅ Successfully installed: ${validPackages.join(', ')}`);

                // Fetch updated package.json from sandbox and save to database
                try {
                    console.log('📥 Fetching updated package.json from sandbox...');
                    const updatedPackageJson = await sandboxData.sandbox.files.read('/home/user/project/package.json');

                    // Get current project files
                    const project = await prisma.project.findUnique({
                        where: { id: projectId },
                        select: { codeFiles: true },
                    });

                    if (project) {
                        const currentFiles = (project.codeFiles as Record<string, string>) || {};
                        currentFiles['package.json'] = updatedPackageJson;

                        // Save updated package.json to database
                        await prisma.project.update({
                            where: { id: projectId },
                            data: {
                                codeFiles: currentFiles,
                                updatedAt: new Date(),
                                lastCodeUpdateAt: new Date()
                            },
                        });

                        console.log('✅ Updated package.json saved to database');
                    }
                } catch (fetchError) {
                    console.error('⚠️ Failed to fetch/save package.json:', fetchError);
                    // Don't fail the whole operation - packages are still installed
                }

                return {
                    success: true,
                    installed: validPackages,
                    output: result.stdout,
                    message: `Installed ${validPackages.length} package(s) and updated package.json in database`,
                };
            } else {
                console.error(`❌ Installation failed:`, result.stderr);
                return {
                    success: false,
                    error: result.stderr || result.stdout || 'Installation failed',
                    packages: validPackages,
                };
            }
        } catch (error) {
            console.error('❌ Package installation error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                packages: validPackages,
            };
        }
    },
});

export const getLogs = tool({
    description: 'Get the dev server logs from the E2B sandbox. Use this to debug runtime errors or check if the app is running correctly.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        lines: z.number().optional().describe('Number of log lines to retrieve (default: 50)'),
    }),
    execute: async ({ projectId, lines = 50 }) => {
        console.log(`📋 Getting last ${lines} log lines for project ${projectId}`);

        const sandboxData = activeSandboxes?.get(projectId);

        if (!sandboxData?.sandbox) {
            return {
                success: false,
                error: 'No active sandbox. Start the preview first.',
            };
        }

        try {
            // Get recent logs from the dev server process
            const result = await sandboxData.sandbox.commands.run(
                `tail -n ${lines} /tmp/dev-server.log 2>/dev/null || echo "No logs available yet"`,
                { timeoutMs: 5000 }
            );

            return {
                success: true,
                logs: result.stdout || 'No logs available',
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get logs',
            };
        }
    },
});

// ============================================================================
// PREVIEW CONTROL
// ============================================================================

export const triggerPreview = tool({
    description: 'Signal that files are ready and preview should start. Call this AFTER you finish creating/updating files with generateFiles(). This emits an event to the frontend to trigger the preview sandbox.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        reason: z.string().optional().describe('Optional: explain why preview is being triggered (e.g., "TodoList component created")'),
    }),
    execute: async ({ projectId, reason }) => {
        console.log(`🎬 Triggering preview${reason ? `: ${reason}` : ''}`);

        // Get the SSE writer from the tool context
        // Note: This will be passed via the tool execution context
        // For now, we'll get it from the global state

        try {
            // Get project and update generation status to "ready"
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { codeFiles: true, version: true, generationStatus: true },
            });

            if (!project) {
                return {
                    success: false,
                    error: 'Project not found',
                };
            }

            const filesCount = Object.keys(project.codeFiles as Record<string, string> || {}).length;
            const newVersion = (project.version || 0) + 1;

            // Update project to mark as ready for preview
            // This will trigger the PreviewPanel's useEffect hook
            // Increment version so PreviewPanel detects the change
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    version: newVersion,
                    generationStatus: 'ready',
                    updatedAt: new Date(),
                    lastCodeUpdateAt: new Date(),
                },
            });

            console.log(`✅ Preview ready signal sent (${filesCount} files, version: ${newVersion}, status: ready)`);

            // Note: SSE event will be emitted by the agent when this tool completes
            // The agent has access to the sseWriter and will emit preview-ready event

            return {
                success: true,
                filesGenerated: filesCount,
                version: newVersion,
                message: `Preview ready! ${filesCount} files are ready to deploy to sandbox. Version: ${newVersion}`,
            };
        } catch (error) {
            console.error('❌ Failed to trigger preview:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to trigger preview',
            };
        }
    },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFileType(extension: string): string {
    const typeMap: Record<string, string> = {
        'tsx': 'React Component',
        'ts': 'TypeScript',
        'jsx': 'React Component',
        'js': 'JavaScript',
        'json': 'Configuration',
        'css': 'Stylesheet',
        'scss': 'Stylesheet',
        'md': 'Documentation',
        'html': 'HTML',
        'svg': 'Image',
        'png': 'Image',
        'jpg': 'Image',
        'jpeg': 'Image',
        'gif': 'Image',
        'webp': 'Image',
    };
    return typeMap[extension.toLowerCase()] || 'File';
}

function buildFileTree(paths: string[]): Record<string, unknown> {
    const tree: Record<string, unknown> = {};

    paths.sort().forEach(path => {
        const parts = path.split('/');
        let current = tree;

        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                // It's a file
                current[part] = 'file';
            } else {
                // It's a directory
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part] as Record<string, unknown>;
            }
        });
    });

    return tree;
}

function formatTree(tree: Record<string, unknown>, indent = ''): string {
    let result = '';
    const entries = Object.entries(tree);

    entries.forEach(([key, value], index) => {
        const isLast = index === entries.length - 1;
        const prefix = isLast ? '└── ' : '├── ';
        const childIndent = indent + (isLast ? '    ' : '│   ');

        if (value === 'file') {
            result += `${indent}${prefix}${key}\n`;
        } else {
            result += `${indent}${prefix}${key}/\n`;
            result += formatTree(value as Record<string, unknown>, childIndent);
        }
    });

    return result;
}

function matchFilePattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching
    // Supports: *.tsx, src/**/*.ts, etc.
    const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
}

// ============================================================================
// SANDBOX MANAGEMENT TOOLS (Phase 3)
// ============================================================================

export const createProjectSandbox = tool({
    description: 'Create or resume an E2B sandbox environment for a project. The sandbox provides a full Linux environment where you can run commands, install packages, and execute code. Use this FIRST before running any commands or installing packages. The sandbox is automatically paused after 5 minutes of inactivity to save costs, and resumed instantly when needed.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
    }),
    execute: async ({ projectId }) => {
        console.log(`🚀 Creating/resuming sandbox for project ${projectId}`);

        try {
            const sandboxInfo = await getOrCreateProjectSandbox(projectId);

            return {
                success: true,
                sandboxId: sandboxInfo.sandboxId,
                message: `Sandbox ready: ${sandboxInfo.sandboxId}`,
            };
        } catch (error) {
            console.error('❌ Failed to create/resume sandbox:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create sandbox',
            };
        }
    },
});

export const pauseProjectSandbox = tool({
    description: 'Pause the sandbox to stop billing while preserving all files and state. Paused sandboxes cost $0 and can be resumed instantly. Use this when work is done or before long idle periods.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
    }),
    execute: async ({ projectId }) => {
        console.log(`⏸️ Pausing sandbox for project ${projectId}`);

        try {
            // Get sandbox ID from project
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { sandboxId: true },
            });

            if (!project?.sandboxId) {
                return {
                    success: false,
                    error: 'No active sandbox found for this project',
                };
            }

            const paused = await pauseSandbox(project.sandboxId);

            return {
                success: paused,
                message: paused
                    ? 'Sandbox paused successfully (no longer billing)'
                    : 'Failed to pause sandbox',
            };
        } catch (error) {
            console.error('❌ Failed to pause sandbox:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to pause sandbox',
            };
        }
    },
});

export const writeSandboxFile = tool({
    description: 'Write a file directly to the sandbox filesystem. This is useful for creating configuration files, scripts, or any files that need to exist in the sandbox but not in the database. Files written here are preserved across pause/resume cycles.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        path: z.string().describe('File path relative to /home/user/project (e.g., ".env", "scripts/setup.sh")'),
        content: z.string().describe('Complete file content'),
    }),
    execute: async ({ projectId, path, content }) => {
        console.log(`📝 Writing sandbox file: ${path}`);

        try {
            // Get sandbox ID from project
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { sandboxId: true },
            });

            if (!project?.sandboxId) {
                return {
                    success: false,
                    error: 'No active sandbox. Use createProjectSandbox first.',
                };
            }

            await writeFileToSandbox(project.sandboxId, path, content);

            return {
                success: true,
                path,
                message: `File written to sandbox: ${path}`,
            };
        } catch (error) {
            console.error(`❌ Failed to write sandbox file ${path}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to write file',
            };
        }
    },
});

export const readSandboxFile = tool({
    description: 'Read a file directly from the sandbox filesystem. Useful for reading generated files, build outputs, log files, or any files that exist in the sandbox but not in the database.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        path: z.string().describe('File path relative to /home/user/project (e.g., "package-lock.json", "dist/index.js")'),
    }),
    execute: async ({ projectId, path }) => {
        console.log(`📖 Reading sandbox file: ${path}`);

        try {
            // Get sandbox ID from project
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { sandboxId: true },
            });

            if (!project?.sandboxId) {
                return {
                    success: false,
                    error: 'No active sandbox. Use createProjectSandbox first.',
                };
            }

            const content = await readFileFromSandbox(project.sandboxId, path);

            return {
                success: true,
                path,
                content,
                size: content.length,
            };
        } catch (error) {
            console.error(`❌ Failed to read sandbox file ${path}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to read file',
            };
        }
    },
});

export const runSandboxCommand = tool({
    description: 'Execute a shell command in the sandbox environment. Use this to run any command like installing packages, building projects, running tests, etc. The command runs in /home/user/project directory automatically. For package installation, this is the primary way to install dependencies.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        command: z.string().describe('Shell command to execute (e.g., "npm install react", "npx create-next-app .", "pnpm build")'),
        timeoutMs: z.number().optional().describe('Command timeout in milliseconds (default: 30000)'),
    }),
    execute: async ({ projectId, command, timeoutMs = 30000 }) => {
        console.log(`🔧 Running sandbox command: ${command}`);

        try {
            // Get sandbox ID from project
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { sandboxId: true },
            });

            if (!project?.sandboxId) {
                return {
                    success: false,
                    error: 'No active sandbox. Use createProjectSandbox first.',
                };
            }

            const result = await executeSandboxCommand(project.sandboxId, command, timeoutMs);

            const success = result.exitCode === 0;

            return {
                success,
                exitCode: result.exitCode,
                stdout: result.stdout,
                stderr: result.stderr,
                command,
            };
        } catch (error) {
            console.error('❌ Command execution failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Command execution failed',
                exitCode: -1,
                command,
            };
        }
    },
});

// ============================================================================
// NEXT.JS PROJECT INITIALIZATION TOOLS
// ============================================================================

export const checkProjectEmpty = tool({
    description: 'Check if the project has any files. Returns isEmpty=true if project has no files, along with file count and generation status. Checks BOTH database AND sandbox for files.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
    }),
    execute: async ({ projectId }) => {
        console.log(`🔍 Checking project ${projectId} file count...`);

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true, generationStatus: true, sandboxId: true },
        });

        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        // Check database files
        const files = (project.codeFiles as Record<string, string>) || {};
        const dbFileCount = Object.keys(files).length;

        // If we have a sandbox, check for files there too
        let sandboxFileCount = 0;
        if (project.sandboxId) {
            try {
                const { executeSandboxCommand } = await import('../e2b/sandbox-manager');
                const findCmd = `find . -type f -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" | wc -l`;
                const result = await executeSandboxCommand(project.sandboxId, findCmd, 10000);
                if (result.exitCode === 0) {
                    sandboxFileCount = parseInt(result.stdout.trim(), 10) || 0;
                }
            } catch (error) {
                console.warn(`⚠️ Could not check sandbox files:`, error);
            }
        }

        const totalFiles = Math.max(dbFileCount, sandboxFileCount);
        const isEmpty = totalFiles === 0 || project.generationStatus === 'empty';

        console.log(`📊 Project status: ${dbFileCount} files in DB, ${sandboxFileCount} files in sandbox, status: ${project.generationStatus}`);

        return {
            success: true,
            isEmpty,
            fileCount: totalFiles,
            dbFileCount,
            sandboxFileCount,
            status: project.generationStatus,
            needsInitialization: isEmpty,
            message: isEmpty
                ? `Project is empty (${dbFileCount} DB files, ${sandboxFileCount} sandbox files). You can initialize with Next.js or create files directly.`
                : `Project has ${totalFiles} files (${dbFileCount} in DB, ${sandboxFileCount} in sandbox).`,
        };
    },
});

export const initializeNextApp = tool({
    description: `Initialize project by syncing Next.js 15 template files from E2B sandbox to database.

This reads all files from the E2B sandbox (which has Next.js pre-installed) and saves them to the database. The template includes Next.js 15, TypeScript, Tailwind CSS v4, and App Router.

After initialization, you can explore with listFiles() and readFile(), then customize files with generateFiles() to build what the user requested.

Example workflow:
→ initializeNextApp() - Syncs Next.js template to database
→ listFiles() - See structure (src/app/, package.json, etc.)
→ readFile('src/app/page.tsx') - Understand layout
→ generateFiles() - Customize for user's needs
→ Result: Working Next.js app instantly`,
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
    }),
    execute: async ({ projectId }) => {
        console.log(`🚀 Initializing Next.js app from E2B sandbox for project ${projectId}...`);

        try {
            // Get or create sandbox for this project (it has Next.js pre-installed!)
            const { getOrCreateProjectSandbox, executeSandboxCommand, readFileFromSandbox, writeFileToSandbox } = await import('../e2b/sandbox-manager');
            const sandboxInfo = await getOrCreateProjectSandbox(projectId, {
                metadata: { projectId },
            });

            // � CHECK: Is this the Craft template with Next.js pre-installed?
            console.log(`🔍 Checking if template is pre-initialized...`);
            let isTemplateReady = false;
            try {
                await readFileFromSandbox(sandboxInfo.sandboxId, '.craft-ready');
                isTemplateReady = true;
                console.log(`✅ Template is pre-initialized - skipping installation`);
            } catch (error) {
                console.log(`⚠️ Template not pre-initialized - will install manually`);
            }

            // If template is NOT pre-installed, install Next.js manually
            if (!isTemplateReady) {
                console.log(`📦 Installing Next.js manually...`);

                // Create proper postcss.config.mjs for Tailwind v4
                const postcssConfig = `const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
`;
                await writeFileToSandbox(sandboxInfo.sandbox, 'postcss.config.mjs', postcssConfig);

                // Install Next.js and Tailwind v4
                const installCmd = `cd /home/user/project && pnpm add next react react-dom typescript tailwindcss postcss autoprefixer @tailwindcss/postcss`;
                await executeSandboxCommand(sandboxInfo.sandbox, installCmd, 120000); // 2 minutes
                console.log(`✅ Next.js installed manually`);
            }

            console.log(`📦 Reading Next.js 15 template from sandbox ${sandboxInfo.sandboxId}...`);

            // List all files in the sandbox using find command (excluding .gitignore patterns)
            // Exclude: node_modules, build outputs, caches, lock files, .git, OS files
            const findCmd = `cd /home/user/project && find . -type f \
                -not -path "./node_modules/*" \
                -not -path "./.next/*" \
                -not -path "./dist/*" \
                -not -path "./build/*" \
                -not -path "./out/*" \
                -not -path "./.git/*" \
                -not -path "./.turbo/*" \
                -not -path "./.cache/*" \
                -not -path "./coverage/*" \
                -not -path "./.vercel/*" \
                -not -path "./.vscode/*" \
                -not -path "./.idea/*" \
                -not -name "pnpm-lock.yaml" \
                -not -name "package-lock.json" \
                -not -name "yarn.lock" \
                -not -name ".DS_Store" \
                -not -name "*.log" \
                -not -name "*.tmp" \
                -not -name "*.temp"`;
            const result = await executeSandboxCommand(sandboxInfo.sandboxId, findCmd, 30000);

            if (result.exitCode !== 0) {
                throw new Error(`Failed to list sandbox files: ${result.stderr}`);
            }

            const filePaths = result.stdout
                .split('\n')
                .filter(Boolean)
                .map(p => p.replace(/^\.\//, '')); // Remove leading ./

            console.log(`📝 Found ${filePaths.length} files in sandbox (gitignore patterns excluded)`);

            // Binary file extensions that should be skipped (contain null bytes)
            const binaryExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.mp4', '.webm', '.mp3', '.wav', '.pdf', '.zip', '.tar', '.gz'];

            // Read all files from sandbox (skip binary files)
            const templateFiles: Record<string, string> = {};
            let skippedBinary = 0;

            for (const relativePath of filePaths) {
                // Skip binary files (they contain null bytes that break PostgreSQL)
                const isBinary = binaryExtensions.some(ext => relativePath.toLowerCase().endsWith(ext));
                if (isBinary) {
                    console.log(`⏭️ Skipping binary file: ${relativePath}`);
                    skippedBinary++;
                    continue;
                }

                try {
                    const content = await readFileFromSandbox(sandboxInfo.sandboxId, relativePath);

                    // Double-check for null bytes (safety check)
                    if (content.includes('\u0000')) {
                        console.warn(`⚠️ Skipping file with null bytes: ${relativePath}`);
                        skippedBinary++;
                        continue;
                    }

                    templateFiles[relativePath] = content;
                } catch (error) {
                    console.warn(`⚠️ Could not read file ${relativePath}:`, error);
                }
            }

            console.log(`✅ Read ${Object.keys(templateFiles).length} files from sandbox (skipped ${skippedBinary} binary files)`);

            // Save template files to database
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    codeFiles: templateFiles,
                    generationStatus: 'initialized',
                    sandboxId: sandboxInfo.sandboxId,
                    updatedAt: new Date(),
                    lastCodeUpdateAt: new Date(),
                },
            });

            console.log(`✅ Next.js 15 initialized with ${Object.keys(templateFiles).length} files from sandbox`);
            console.log('⚠️ AI MUST now customize these files based on user requirements!');

            const keyFiles = Object.keys(templateFiles).filter(f =>
                f.includes('page.tsx') ||
                f.includes('layout.tsx') ||
                f.includes('package.json') ||
                f.includes('tsconfig.json') ||
                f.includes('globals.css')
            );

            return {
                success: true,
                message: `Next.js 15 initialized with ${Object.keys(templateFiles).length} files from E2B sandbox. You MUST now customize them for user's app.`,
                filesCreated: Object.keys(templateFiles).length,
                keyFiles: keyFiles.slice(0, 15),
                sandboxId: sandboxInfo.sandboxId,
                nextSteps: [
                    '1. Use listFiles() to see all generated files',
                    '2. Use readFile() to examine src/app/page.tsx, src/app/layout.tsx',
                    '3. Use generateFiles() to customize files for user\'s specific request',
                    '4. Create new components in src/components/ as needed',
                    '5. Build the user\'s app with the customized template',
                ],
            };
        } catch (error) {
            console.error('❌ Error initializing Next.js project:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
});

export const syncFilesToDB = tool({
    description: 'Sync all files from E2B sandbox to database for persistence. Call this AFTER completing all changes to save the final state. This ensures files survive sandbox restarts and are available for future edits.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        reason: z.string().optional().describe('Reason for syncing (e.g., "Next.js initialization complete")'),
    }),
    execute: async ({ projectId, reason }) => {
        console.log(`💾 Syncing sandbox to database${reason ? `: ${reason}` : ''}...`);

        try {
            // Get sandbox
            const sandbox = await getOrCreateProjectSandbox(projectId);

            // Read all project files from sandbox (excluding .gitignore patterns)
            // Exclude: node_modules, build outputs, caches, lock files, .git, OS files
            const findCmd = `find . -type f \
                -not -path "./node_modules/*" \
                -not -path "./.next/*" \
                -not -path "./dist/*" \
                -not -path "./build/*" \
                -not -path "./out/*" \
                -not -path "./.git/*" \
                -not -path "./.turbo/*" \
                -not -path "./.cache/*" \
                -not -path "./coverage/*" \
                -not -path "./.vercel/*" \
                -not -path "./.vscode/*" \
                -not -path "./.idea/*" \
                -not -name "pnpm-lock.yaml" \
                -not -name "package-lock.json" \
                -not -name "yarn.lock" \
                -not -name ".DS_Store" \
                -not -name "*.log" \
                -not -name "*.tmp" \
                -not -name "*.temp"`;

            const lsResult = await executeSandboxCommand(sandbox.sandboxId, findCmd, 30000);

            if (lsResult.exitCode !== 0) {
                return {
                    success: false,
                    error: 'Failed to list sandbox files',
                    stderr: lsResult.stderr,
                };
            }

            const filePaths = lsResult.stdout
                .split('\n')
                .filter(Boolean)
                .map(p => p.replace(/^\.\//, ''));

            console.log(`📦 Found ${filePaths.length} files to sync`);

            // Read all file contents in parallel (batch of 10 at a time)
            const filesData: Record<string, string> = {};
            let readCount = 0;
            let skippedBinary = 0;

            // Binary file extensions that should be skipped (contain null bytes)
            const binaryExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.mp4', '.webm', '.mp3', '.wav', '.pdf', '.zip', '.tar', '.gz'];

            for (let i = 0; i < filePaths.length; i += 10) {
                const batch = filePaths.slice(i, i + 10);
                const results = await Promise.allSettled(
                    batch.map(async (filePath) => {
                        // Skip binary files
                        const isBinary = binaryExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
                        if (isBinary) {
                            console.log(`⏭️ Skipping binary file: ${filePath}`);
                            return { filePath, content: null, skipped: true };
                        }

                        const content = await readFileFromSandbox(sandbox.sandboxId, filePath);

                        // Remove null bytes that break PostgreSQL
                        const sanitized = content.replace(/\u0000/g, '');

                        // If content became empty or significantly changed, skip it (likely binary)
                        if (!sanitized || sanitized.length < content.length * 0.5) {
                            console.warn(`⚠️ Skipping file with null bytes: ${filePath}`);
                            return { filePath, content: null, skipped: true };
                        }

                        return { filePath, content: sanitized, skipped: false };
                    })
                );

                results.forEach((result) => {
                    if (result.status === 'fulfilled' && !result.value.skipped && result.value.content) {
                        filesData[result.value.filePath] = result.value.content;
                        readCount++;
                    } else if (result.status === 'fulfilled' && result.value.skipped) {
                        skippedBinary++;
                    }
                });
            }

            // Update database with all files
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    codeFiles: filesData,
                    updatedAt: new Date(),
                    lastCodeUpdateAt: new Date(),
                    version: { increment: 1 },
                    generationStatus: 'ready', // Mark as ready now that files are synced
                },
            });

            console.log(`✅ Synced ${readCount} files to database (skipped ${skippedBinary} binary files)`);

            return {
                success: true,
                filesSynced: readCount,
                totalFiles: filePaths.length,
                skipped: skippedBinary,
                message: `Successfully synced ${readCount} files to database (skipped ${skippedBinary} binary files)`,
            };
        } catch (error) {
            console.error('❌ Error syncing to database:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
});

export const validateProject = tool({
    description: 'Validate the Next.js project structure and check for common issues. Use after initialization or major changes to ensure everything is set up correctly.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
    }),
    execute: async ({ projectId }) => {
        console.log(`🔍 Validating project ${projectId}...`);

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });

        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        const files = (project.codeFiles as Record<string, string>) || {};
        const filePaths = Object.keys(files);

        // Check for required Next.js files
        const requiredFiles = [
            'package.json',
            'next.config.ts',
            'tsconfig.json',
            'tailwind.config.ts',
            'postcss.config.mjs',
        ];

        const missingFiles = requiredFiles.filter(f => !filePaths.includes(f));

        // Check for app structure
        const hasAppDir = filePaths.some(f => f.startsWith('src/app/') || f.startsWith('app/'));
        const hasLayout = filePaths.some(f => f.includes('layout.tsx'));
        const hasPage = filePaths.some(f => f.includes('page.tsx'));

        // Check package.json for correct dependencies
        const packageJson = files['package.json'];
        let hasTailwindV4 = false;
        let hasNextJs15 = false;

        if (packageJson) {
            try {
                const pkg = JSON.parse(packageJson);
                hasTailwindV4 = pkg.devDependencies?.['tailwindcss']?.startsWith('^4') || false;
                hasNextJs15 = pkg.dependencies?.['next']?.includes('15') || false;
            } catch (error) {
                console.error('Failed to parse package.json:', error);
            }
        }

        const issues = [];
        const warnings = [];

        if (missingFiles.length > 0) {
            issues.push(`Missing required files: ${missingFiles.join(', ')}`);
        }
        if (!hasAppDir) {
            issues.push('No App Router directory found (src/app/ or app/)');
        }
        if (!hasLayout) {
            warnings.push('No layout.tsx found');
        }
        if (!hasPage) {
            warnings.push('No page.tsx found');
        }
        if (!hasTailwindV4) {
            warnings.push('Tailwind CSS v4 not detected (should use ^4.0.0)');
        }
        if (!hasNextJs15) {
            warnings.push('Next.js 15 not detected');
        }

        const isValid = issues.length === 0;

        return {
            success: true,
            isValid,
            fileCount: filePaths.length,
            hasAppDir,
            hasLayout,
            hasPage,
            hasTailwindV4,
            hasNextJs15,
            issues,
            warnings,
            message: isValid
                ? `✅ Project structure is valid (${filePaths.length} files)`
                : `⚠️ Project has ${issues.length} issues and ${warnings.length} warnings`,
        };
    },
});

// ============================================================================
// EXPORT ALL TOOLS
// ============================================================================

export const tools = {
    // Core file operations (order matters - investigation tools first)
    listFiles,
    readFile,
    generateFiles,
    deleteFile,

    // Execution tools
    runCommand,
    installPackages,

    // Advanced analysis tools
    getProjectStructure,
    searchFiles,
    getLogs,

    // Preview control
    triggerPreview,

    // Next.js project initialization (Phase 3.1)
    checkProjectEmpty,
    initializeNextApp,
    syncFilesToDB,
    validateProject,

    // Sandbox management (Phase 3)
    createProjectSandbox,
    pauseProjectSandbox,
    writeSandboxFile,
    readSandboxFile,
    runSandboxCommand,
};

// Export orchestrator tools separately (for orchestrator agent only)
export { orchestratorTools } from './orchestrator-tools';
