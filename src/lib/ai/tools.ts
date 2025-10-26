/**
 * AI Tools for File Operations and Commands
 */

import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { activeSandboxes } from "@/app/api/sandbox/[projectId]/route";

export const generateFiles = tool({
    description: 'Generate or update files',
    inputSchema: z.object({
        projectId: z.string(),
        files: z.array(z.object({
            path: z.string(),
            content: z.string(),
        })),
    }),
    execute: async ({ projectId, files }) => {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });
        if (!project) return { success: false, error: 'Project not found' };

        const currentFiles = (project.codeFiles as Record<string, string>) || {};
        for (const { path, content } of files) {
            currentFiles[path] = content;
        }

        await prisma.project.update({
            where: { id: projectId },
            data: { codeFiles: currentFiles, updatedAt: new Date(), lastCodeUpdateAt: new Date() },
        });

        const sandboxData = activeSandboxes?.get(projectId);
        if (sandboxData?.sandbox) {
            await Promise.all(files.map(async ({ path, content }) => {
                await sandboxData.sandbox.files.write(`/home/user/project/${path}`, content);
            }));
        }

        return { success: true, filesCreated: files.length };
    },
});

export const readFile = tool({
    description: 'Read file content',
    inputSchema: z.object({
        projectId: z.string(),
        path: z.string(),
    }),
    execute: async ({ projectId, path }) => {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });
        if (!project) return { success: false, error: 'Project not found' };

        const files = (project.codeFiles as Record<string, string>) || {};
        const content = files[path];
        if (!content) return { success: false, error: 'File not found' };

        return { success: true, path, content };
    },
});

export const listFiles = tool({
    description: 'List all files',
    inputSchema: z.object({
        projectId: z.string(),
    }),
    execute: async ({ projectId }) => {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });
        if (!project) return { success: false, error: 'Project not found' };

        const files = (project.codeFiles as Record<string, string>) || {};
        return { success: true, files: Object.keys(files) };
    },
});

export const deleteFile = tool({
    description: 'Delete a file',
    inputSchema: z.object({
        projectId: z.string(),
        path: z.string(),
    }),
    execute: async ({ projectId, path }) => {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });
        if (!project) return { success: false, error: 'Project not found' };

        const files = (project.codeFiles as Record<string, string>) || {};
        if (!files[path]) return { success: false, error: 'File not found' };

        delete files[path];
        await prisma.project.update({
            where: { id: projectId },
            data: { codeFiles: files, updatedAt: new Date() },
        });

        return { success: true };
    },
});

export const runCommand = tool({
    description: 'Run shell command',
    inputSchema: z.object({
        projectId: z.string(),
        command: z.string(),
    }),
    execute: async ({ projectId, command }) => {
        const sandboxData = activeSandboxes?.get(projectId);
        if (!sandboxData?.sandbox) return { success: false, error: 'No sandbox' };

        const result = await sandboxData.sandbox.commands.run(`cd /home/user/project && ${command}`);
        return {
            success: result.exitCode === 0,
            exitCode: result.exitCode,
            stdout: result.stdout || "",
            stderr: result.stderr || "",
        };
    },
});

export const tools = {
    generateFiles,
    readFile,
    listFiles,
    deleteFile,
    runCommand,
};
