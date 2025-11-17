/**
 * Orchestrator Tools for Multi-Agent System
 * Phase 3 Implementation
 * 
 * These tools are used by the orchestrator agent (Grok 4 Fast) to:
 * - Create and manage projects
 * - Generate project names
 * - Plan high-level tasks
 * - Delegate tasks to coding agent
 * - Track progress and completion
 */

import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateText } from "ai";
import { createXai } from "@ai-sdk/xai";
import { SessionManager } from "./orchestrator/session-manager";
import { TaskManager } from "./orchestrator/task-manager";
import type { TaskInfo, TaskPhase } from "@/types/orchestrator";
import {
    createMemory,
    updateMemory,
    deactivateMemory,
    getRelevantMemories,
} from "@/lib/memory/service";

const xai = createXai({
    apiKey: process.env.XAI_API_KEY || "",
});

// ============================================================================
// PROJECT MANAGEMENT TOOLS
// ============================================================================

export const createProject = tool({
    description: `Create a new project in the database. Use this when user wants to start a new project.
    Returns the project ID which should be used for all subsequent operations.`,

    inputSchema: z.object({
        name: z.string().describe("Project name"),
        description: z.string().optional().describe("Project description"),
        userId: z.string().describe("User ID who owns the project"),
    }),

    execute: async ({ name, description, userId }) => {
        console.log(`🚀 Creating new project: ${name}`);

        try {
            const project = await prisma.project.create({
                data: {
                    name,
                    description: description || null,
                    userId,
                    type: "webapp",
                    status: "active",
                    visibility: "private",
                    version: 0,
                    generationStatus: "empty",
                    codeFiles: {},
                },
            });

            console.log(`✅ Created project: ${project.id}`);
            return {
                success: true,
                projectId: project.id,
                projectName: project.name,
            };
        } catch (error) {
            console.error("❌ Failed to create project:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to create project",
            };
        }
    },
});

export const generateProjectName = tool({
    description: `Generate a creative, descriptive project name based on the user's request.
    Use this when user hasn't provided a specific project name.`,

    inputSchema: z.object({
        userRequest: z.string().describe("The user's request/description"),
    }),

    execute: async ({ userRequest }) => {
        console.log(`💡 Generating project name for: ${userRequest}`);

        try {
            const model = xai("grok-4-fast");

            const result = await generateText({
                model,
                prompt: `Generate a short, creative project name (2-4 words, kebab-case) for this request:
                
"${userRequest}"

Rules:
- Use kebab-case (e.g., "todo-app", "dashboard-pro")
- Be descriptive but concise
- Avoid generic names like "my-app" or "new-project"
- Make it memorable and relevant

Respond with ONLY the project name, nothing else.`,
                maxOutputTokens: 50,
            });

            const projectName = result.text.trim().toLowerCase();

            console.log(`✅ Generated name: ${projectName}`);
            return {
                success: true,
                projectName,
            };
        } catch (error) {
            console.error("❌ Failed to generate name:", error);

            // Fallback to simple name
            const fallbackName = `project-${Date.now()}`;
            return {
                success: true,
                projectName: fallbackName,
                usedFallback: true,
            };
        }
    },
});

// ============================================================================
// TASK PLANNING TOOLS
// ============================================================================

export const createTaskList = tool({
    description: `Break down a user request into HIGH-LEVEL project phases only (3-6 phases).
    Create phases like: setup, initialize, implement, build, preview.
    DO NOT create granular file-level tasks - the coding agent handles all implementation details.`,

    inputSchema: z.object({
        sessionId: z.string().describe("The session ID"),
        userRequest: z.string().describe("The user's request to break down"),
        projectContext: z.object({
            projectId: z.string().optional(),
            hasProject: z.boolean().optional(),
            projectType: z.string().optional(),
        }).optional().describe("Context about the existing project"),
    }),

    execute: async ({ sessionId, userRequest, projectContext }) => {
        console.log(`🎯 Creating HIGH-LEVEL task list for: ${userRequest}`);

        try {
            const model = xai("grok-4-fast");

            const prompt = `You are an expert project orchestrator. Break down this user request into HIGH-LEVEL phases only.

User Request: ${userRequest}

Project Context:
- Has existing project: ${projectContext?.hasProject ? "Yes" : "No"}
- Project type: ${projectContext?.projectType || "Unknown"}

CRITICAL RULES:

1. **Create HIGH-LEVEL Phases ONLY** (3-6 total):
   - setup: Setup sandbox environment (Node.js, pnpm verification)
   - initialize: Initialize project (run create-next-app, etc.)
   - implement: Build features (entire feature, let coding agent decide files)
   - build: Build & validate (ensure no errors)
   - preview: Trigger preview for user

2. **DO NOT specify individual files** - coding agent handles that
3. **DO NOT create tasks for individual components** - coding agent decides
4. **DO specify feature requirements** - what the user wants, not how to build it

Output as JSON array:
[
  {
    "phase": "setup" | "initialize" | "implement" | "build" | "preview",
    "description": "High-level description of the phase",
    "dependsOn": [], // Array of previous task indices (e.g., [0, 1])
    "tier": "fast" | "expert",
    "estimatedTime": 30 // seconds
  }
]

Example for "create a todo app":
[
  {
    "phase": "setup",
    "description": "Setup Next.js development environment in sandbox",
    "dependsOn": [],
    "tier": "fast",
    "estimatedTime": 15
  },
  {
    "phase": "initialize",
    "description": "Initialize Next.js project with TypeScript and Tailwind",
    "dependsOn": [0],
    "tier": "fast",
    "estimatedTime": 45
  },
  {
    "phase": "implement",
    "description": "Build todo app with add/delete functionality, state management, and UI components",
    "dependsOn": [1],
    "tier": "fast",
    "estimatedTime": 90
  },
  {
    "phase": "build",
    "description": "Build project and validate for errors",
    "dependsOn": [2],
    "tier": "fast",
    "estimatedTime": 30
  },
  {
    "phase": "preview",
    "description": "Trigger preview to show completed todo app",
    "dependsOn": [3],
    "tier": "fast",
    "estimatedTime": 10
  }
]

Now create the task list (respond with JSON only):`;

            const result = await generateText({
                model,
                prompt,
                maxOutputTokens: 1500,
            });

            // Parse JSON response
            const taskDefinitions = JSON.parse(result.text);

            // Create tasks in database
            const createdTasks: TaskInfo[] = [];
            const taskIdMap = new Map<number, string>(); // index -> taskId

            for (let i = 0; i < taskDefinitions.length; i++) {
                const def = taskDefinitions[i];

                // Map dependencies from indices to task IDs
                const dependsOn = def.dependsOn.map((depIndex: number) => {
                    return taskIdMap.get(depIndex) || "";
                }).filter(Boolean);

                const task = await TaskManager.createTask(sessionId, {
                    phase: def.phase as TaskPhase,
                    description: def.description,
                    status: "pending",
                    assignedTo: "coding-agent",
                    tier: def.tier || "fast",
                    dependsOn,
                    attempts: 0,
                    maxAttempts: 3,
                });

                createdTasks.push(task);
                taskIdMap.set(i, task.id);
            }

            console.log(`✅ Created ${createdTasks.length} tasks`);
            return {
                success: true,
                tasks: createdTasks,
                totalTasks: createdTasks.length,
            };
        } catch (error) {
            console.error("❌ Failed to create task list:", error);

            // Fallback: create simple implement + preview tasks
            const fallbackTasks = await TaskManager.createTasks(sessionId, [
                {
                    phase: "implement",
                    description: userRequest,
                    status: "pending",
                    assignedTo: "coding-agent",
                    tier: "fast",
                    dependsOn: [],
                    attempts: 0,
                    maxAttempts: 3,
                },
                {
                    phase: "preview",
                    description: "Trigger preview to show result",
                    status: "pending",
                    assignedTo: "coding-agent",
                    tier: "fast",
                    dependsOn: [], // Will be set after first task created
                    attempts: 0,
                    maxAttempts: 3,
                },
            ]);

            // Update preview task to depend on implement task
            if (fallbackTasks.length === 2) {
                await TaskManager.updateTask(sessionId, fallbackTasks[1].id, {
                    status: "pending",
                });
            }

            return {
                success: true,
                tasks: fallbackTasks,
                totalTasks: fallbackTasks.length,
                usedFallback: true,
            };
        }
    },
});

// ============================================================================
// TASK DELEGATION TOOLS
// ============================================================================

export const delegateTaskToCodingAgent = tool({
    description: `Delegate a specific task to the coding agent for execution.
    The coding agent will use its tools (generateFiles, runCommand, etc.) to complete the task.
    This tool handles the delegation, execution, and result reporting.`,

    inputSchema: z.object({
        sessionId: z.string().describe("The session ID"),
        taskId: z.string().describe("The task ID to execute"),
        requirements: z.string().describe("Detailed requirements and context for the task"),
    }),

    execute: async ({ sessionId, taskId, requirements }) => {
        console.log(`🎯 Delegating task ${taskId} to coding agent`);

        try {
            // Get task details
            const task = await TaskManager.getTask(sessionId, taskId);
            if (!task) {
                return {
                    success: false,
                    error: `Task not found: ${taskId}`,
                };
            }

            // Update task status to in-progress
            await TaskManager.updateTask(sessionId, taskId, {
                status: "in-progress",
            });

            console.log(`📋 Task: [${task.phase}] ${task.description}`);
            console.log(`📝 Requirements: ${requirements}`);

            // Mark successful delegation
            // Note: Actual execution happens in orchestrator-agent.ts via streamCodingResponse
            return {
                success: true,
                taskId,
                taskPhase: task.phase,
                taskDescription: task.description,
                requirements,
                message: "Task delegation initiated - coding agent will execute",
            };
        } catch (error) {
            console.error(`❌ Failed to delegate task ${taskId}:`, error);

            await TaskManager.updateTask(sessionId, taskId, {
                status: "failed",
            });

            return {
                success: false,
                taskId,
                error: error instanceof Error ? error.message : "Delegation failed",
            };
        }
    },
});

// ============================================================================
// PROGRESS TRACKING TOOLS
// ============================================================================

export const getSessionProgress = tool({
    description: `Get current progress of the session including task counts and completion percentage.
    Use this to track how the project is progressing.`,

    inputSchema: z.object({
        sessionId: z.string().describe("The session ID"),
    }),

    execute: async ({ sessionId }) => {
        console.log(`📊 Getting progress for session ${sessionId}`);

        try {
            const progress = await TaskManager.getProgress(sessionId);

            return {
                success: true,
                progress,
            };
        } catch (error) {
            console.error("❌ Failed to get progress:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to get progress",
            };
        }
    },
});

export const checkTaskCompletion = tool({
    description: `Check if all tasks in the session are complete.
    Returns true if all tasks are either completed or failed.`,

    inputSchema: z.object({
        sessionId: z.string().describe("The session ID"),
    }),

    execute: async ({ sessionId }) => {
        console.log(`✓ Checking task completion for session ${sessionId}`);

        try {
            const allComplete = await TaskManager.areAllTasksComplete(sessionId);
            const failedTasks = await TaskManager.getFailedTasks(sessionId);

            return {
                success: true,
                allComplete,
                hasFailures: failedTasks.length > 0,
                failedTaskCount: failedTasks.length,
            };
        } catch (error) {
            console.error("❌ Failed to check completion:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to check completion",
            };
        }
    },
});

// ============================================================================
// MEMORY MANAGEMENT TOOLS
// ============================================================================

export const createUserMemory = tool({
    description: `Create a new memory about the user. Use this to save important information you learn about the user's:
    - Preferences (UI/workflow choices)
    - Skills (technical expertise)
    - Project context (what they're building)
    - Workflow (how they like to work)
    - Style (coding/design preferences)
    - Technical stack (frameworks, tools)
    - Personal info (occupation, timezone, etc.)
    
    This helps provide better, personalized assistance in future conversations.`,

    inputSchema: z.object({
        userId: z.string().describe("The user ID"),
        category: z.enum([
            "preference",
            "skill",
            "project_context",
            "workflow",
            "style",
            "technical",
            "personal",
        ]).describe("Memory category"),
        title: z.string().describe("Brief title (3-5 words)"),
        content: z.string().describe("Detailed memory content (1-2 sentences)"),
        importance: z.number().min(1).max(10).optional().describe("Importance level (1-10, default: 5)"),
        projectId: z.string().optional().describe("Optional: Link to specific project"),
    }),

    execute: async ({ userId, category, title, content, importance, projectId }) => {
        console.log(`🧠 Creating memory: ${title}`);

        try {
            const memory = await createMemory({
                userId,
                category,
                title,
                content,
                importance: importance || 5,
                projectId,
            });

            console.log(`✅ Memory created: ${memory.id}`);
            return {
                success: true,
                memoryId: memory.id,
                message: `Saved: ${title}`,
            };
        } catch (error) {
            console.error("❌ Failed to create memory:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to create memory",
            };
        }
    },
});

export const updateUserMemory = tool({
    description: `Update an existing memory about the user. Use this when you learn new information that modifies or enhances an existing memory.`,

    inputSchema: z.object({
        memoryId: z.string().describe("The memory ID to update"),
        title: z.string().optional().describe("Updated title"),
        content: z.string().optional().describe("Updated content"),
        importance: z.number().min(1).max(10).optional().describe("Updated importance (1-10)"),
        category: z.enum([
            "preference",
            "skill",
            "project_context",
            "workflow",
            "style",
            "technical",
            "personal",
        ]).optional().describe("Updated category"),
    }),

    execute: async ({ memoryId, title, content, importance, category }) => {
        console.log(`🔄 Updating memory: ${memoryId}`);

        try {
            const memory = await updateMemory(memoryId, {
                title,
                content,
                importance,
                category,
            });

            console.log(`✅ Memory updated: ${memoryId}`);
            return {
                success: true,
                memoryId: memory.id,
                message: "Memory updated successfully",
            };
        } catch (error) {
            console.error("❌ Failed to update memory:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to update memory",
            };
        }
    },
});

export const removeUserMemory = tool({
    description: `Remove a memory about the user. Use this when:
    - Information becomes outdated or incorrect
    - User requests to forget something
    - Memory is no longer relevant
    
    This performs a soft delete (memory is deactivated, not permanently deleted).`,

    inputSchema: z.object({
        memoryId: z.string().describe("The memory ID to remove"),
    }),

    execute: async ({ memoryId }) => {
        console.log(`🗑️ Removing memory: ${memoryId}`);

        try {
            await deactivateMemory(memoryId);

            console.log(`✅ Memory removed: ${memoryId}`);
            return {
                success: true,
                memoryId,
                message: "Memory removed successfully",
            };
        } catch (error) {
            console.error("❌ Failed to remove memory:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to remove memory",
            };
        }
    },
});

export const getUserMemories = tool({
    description: `Retrieve relevant memories about the user. Use this to:
    - Recall user preferences and context
    - Personalize responses based on past learnings
    - Reference project-specific information
    
    Returns the most important and recently used memories.`,

    inputSchema: z.object({
        userId: z.string().describe("The user ID"),
        projectId: z.string().optional().describe("Optional: Filter by project"),
        category: z.enum([
            "preference",
            "skill",
            "project_context",
            "workflow",
            "style",
            "technical",
            "personal",
        ]).optional().describe("Optional: Filter by category"),
        limit: z.number().optional().describe("Max number of memories to return (default: 10)"),
    }),

    execute: async ({ userId, projectId, category, limit }) => {
        console.log(`🔍 Retrieving memories for user: ${userId}`);

        try {
            const memories = await getRelevantMemories({
                userId,
                projectId,
                category,
                limit: limit || 10,
            });

            console.log(`✅ Found ${memories.length} memories`);
            return {
                success: true,
                memories: memories.map(m => ({
                    id: m.id,
                    category: m.category,
                    title: m.title,
                    content: m.content,
                    importance: m.importance,
                })),
                count: memories.length,
            };
        } catch (error) {
            console.error("❌ Failed to retrieve memories:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to retrieve memories",
                memories: [],
                count: 0,
            };
        }
    },
});

// ============================================================================
// EXPORT ORCHESTRATOR TOOLS
// ============================================================================

export const orchestratorTools = {
    // Project management
    createProject,
    generateProjectName,

    // Task planning
    createTaskList,

    // Task delegation
    delegateTaskToCodingAgent,

    // Progress tracking
    getSessionProgress,
    checkTaskCompletion,

    // Memory management
    createUserMemory,
    updateUserMemory,
    removeUserMemory,
    getUserMemories,
};
