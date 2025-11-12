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
import { activeSandboxes } from "@/app/api/sandbox/[projectId]/route";
import { getToolContext } from "@/lib/ai/tool-context";
import { SSEStreamWriter } from "@/lib/ai/sse-events";

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
    description: 'Create or update multiple files at once. Files are automatically synced to the E2B sandbox with hot reload. ALWAYS read existing files first to avoid overwriting important code. Provide complete file content, not partial updates. NOTE: For adding npm packages, use the installPackages tool instead of manually editing package.json.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        files: z.array(z.object({
            path: z.string().describe('Full file path (e.g., "src/components/Button.tsx")'),
            content: z.string().describe('Complete file content - must be valid, complete code'),
        })).describe('Array of files to create/update'),
        reason: z.string().optional().describe('Optional: explain why these files are being generated'),
    }),
    execute: async ({ projectId, files, reason }) => {
        console.log(`📝 Generating ${files.length} file(s)${reason ? `: ${reason}` : ''}`);

        // Get tool context for SSE streaming
        const context = getToolContext();
        const sseWriter = context?.sseWriter;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });

        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        const currentFiles = (project.codeFiles as Record<string, string>) || {};
        const changes: Array<{ path: string; action: 'created' | 'updated'; lines: number }> = [];

        // Update files in database AND stream to frontend
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

            currentFiles[path] = content;
            changes.push({ path, action: isNew ? 'created' : 'updated', lines });
            console.log(`  ${isNew ? '➕' : '✏️'} ${path} (${lines} lines)`);

            // ⚡ SSE: Emit file-stream-complete event
            if (sseWriter) {
                sseWriter.writeFileStreamComplete(path, {
                    content,
                    language,
                    isNew,
                });
            }
        }

        // Save to database
        await prisma.project.update({
            where: { id: projectId },
            data: {
                codeFiles: currentFiles,
                updatedAt: new Date(),
                lastCodeUpdateAt: new Date()
            },
        });

        // Sync to E2B sandbox if active
        const sandboxData = activeSandboxes?.get(projectId);
        if (sandboxData?.sandbox) {
            console.log(`🔄 Syncing ${files.length} file(s) to E2B sandbox...`);
            const syncResults = await Promise.allSettled(files.map(async ({ path, content }) => {
                await sandboxData.sandbox.files.write(`/home/user/project/${path}`, content);
                return path;
            }));

            const synced = syncResults.filter(r => r.status === 'fulfilled').length;
            console.log(`✅ Synced ${synced}/${files.length} files to sandbox`);
        }

        return {
            success: true,
            filesCreated: changes.filter(c => c.action === 'created').length,
            filesUpdated: changes.filter(c => c.action === 'updated').length,
            changes,
            message: `Successfully ${changes.filter(c => c.action === 'created').length > 0 ? 'created' : 'updated'} ${files.length} file(s)`,
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

export const validateSyntax = tool({
    description: 'Validate TypeScript/JavaScript syntax without running the code. Use this after generating or modifying files to check for compilation errors. This helps catch mistakes before the user sees them.',
    inputSchema: z.object({
        projectId: z.string().describe('The project ID'),
        files: z.array(z.string()).optional().describe('Optional: specific files to validate. If not provided, validates all TypeScript files.'),
    }),
    execute: async ({ projectId, files }) => {
        console.log(`✅ Validating syntax${files ? ` for ${files.length} file(s)` : ' for all files'}`);

        const sandboxData = activeSandboxes?.get(projectId);

        if (!sandboxData?.sandbox) {
            return {
                success: false,
                error: 'No active sandbox',
            };
        }

        const fileArgs = files && files.length > 0 ? files.join(' ') : '';
        const command = `pnpm tsc --noEmit ${fileArgs}`.trim();

        try {
            const result = await sandboxData.sandbox.commands.run(
                `cd /home/user/project && ${command}`,
                { timeoutMs: 30000 }
            );

            const hasErrors = result.exitCode !== 0;

            if (!hasErrors) {
                console.log(`✅ No syntax errors found`);
            } else {
                console.log(`❌ Syntax errors found`);
            }

            return {
                success: !hasErrors,
                valid: !hasErrors,
                errors: hasErrors ? result.stdout : undefined,
                message: hasErrors
                    ? 'TypeScript compilation errors found - please fix these errors'
                    : 'No syntax errors found',
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed',
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
    validateSyntax,
    getLogs,

    // Preview control
    triggerPreview,
};
