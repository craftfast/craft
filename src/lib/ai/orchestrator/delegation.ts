/**
 * Delegation utilities for executing tasks via coding agent
 * 
 * This handles the actual execution of tasks by delegating to the coding agent,
 * which uses its tools (generateFiles, runCommand, etc.) to complete work.
 */

import { streamCodingResponse } from "@/lib/ai/agent";
import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { TaskManager } from "./task-manager";
import type { SSEStreamWriter } from "@/lib/ai/sse-events";
import type { TaskPhase } from "@/types/orchestrator";

interface DelegationOptions {
    sessionId: string;
    taskId: string;
    taskPhase: TaskPhase;
    taskDescription: string;
    requirements: string;
    userId: string;
    projectId?: string;
    projectFiles?: Record<string, string>;
    sseWriter: SSEStreamWriter;
    tier?: 'fast' | 'expert';
}

/**
 * Execute a task by delegating to the coding agent
 */
export async function executeTaskWithCodingAgent(options: DelegationOptions): Promise<{
    success: boolean;
    output?: string;
    filesCreated?: string[];
    error?: string;
}> {
    const {
        sessionId,
        taskId,
        taskPhase,
        taskDescription,
        requirements,
        userId,
        projectId,
        projectFiles = {},
        sseWriter,
        tier = 'fast',
    } = options;

    console.log(`🤖 Executing task ${taskId} via coding agent`);
    console.log(`   Phase: ${taskPhase}`);
    console.log(`   Description: ${taskDescription}`);

    try {
        // Emit delegation event
        sseWriter.writeOrchestratorDelegation(taskId);

        // Build specialized prompt based on task phase
        const taskPrompt = buildTaskPrompt(taskPhase, taskDescription, requirements);

        // Create message for coding agent
        const messages = [
            {
                role: 'user' as const,
                content: taskPrompt,
            },
        ];

        // Get system prompt for coding task
        const systemPrompt = getSystemPrompt('coding', projectFiles, projectId);

        // Track output
        let fullOutput = '';
        const filesCreated: string[] = [];

        // Stream coding response
        const result = await streamCodingResponse({
            messages,
            systemPrompt,
            projectFiles,
            conversationHistory: [],
            userId,
            tier,
            sseWriter,
            projectId,
            sessionId,
            enableAgentLoop: false, // Disabled for delegation tasks
            onFinish: async (usageData) => {
                console.log(`✅ Task ${taskId} completed - Tokens: ${usageData.totalTokens}`);
            },
        });

        // Collect text output
        for await (const chunk of result.textStream) {
            fullOutput += chunk;
        }

        console.log(`✅ Task ${taskId} execution completed`);

        // Update task status to completed
        await TaskManager.updateTask(sessionId, taskId, {
            status: 'completed',
            result: {
                success: true,
                filesCreated,
                commandOutput: fullOutput,
                metadata: {
                    phase: taskPhase,
                    completedAt: new Date().toISOString(),
                },
            },
        });

        // Emit completion event
        sseWriter.writeOrchestratorTaskCompleted(taskId, true);

        return {
            success: true,
            output: fullOutput,
            filesCreated,
        };

    } catch (error) {
        console.error(`❌ Failed to execute task ${taskId}:`, error);

        // Update task status to failed
        await TaskManager.updateTask(sessionId, taskId, {
            status: 'failed',
            result: {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                metadata: {
                    phase: taskPhase,
                    failedAt: new Date().toISOString(),
                },
            },
        });

        // Emit failure event
        sseWriter.writeOrchestratorTaskCompleted(taskId, false);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Build specialized prompt based on task phase
 */
function buildTaskPrompt(
    phase: TaskPhase,
    description: string,
    requirements: string
): string {
    const prompts: Record<TaskPhase, string> = {
        setup: `
🔧 SETUP TASK

Description: ${description}

Requirements:
${requirements}

Your goal: Set up the development environment and prepare the workspace for the project.
Use your tools to create necessary directories, install dependencies, and configure the environment.

Complete this setup task efficiently and confirm when done.`,

        initialize: `
🚀 INITIALIZATION TASK

Description: ${description}

Requirements:
${requirements}

Your goal: Initialize the project with the specified technology stack and configuration.
Create the project structure, configuration files, and initial boilerplate code.

Use your generateFiles tool to create all necessary files.
Complete this initialization and confirm when done.`,

        implement: `
💻 IMPLEMENTATION TASK

Description: ${description}

Requirements:
${requirements}

Your goal: Implement the features and functionality described above.
Write clean, production-ready code following best practices.
Create all necessary components, utilities, and logic.

Use your generateFiles tool to create/update files.
Complete this implementation thoroughly and confirm when done.`,

        build: `
🔨 BUILD TASK

Description: ${description}

Requirements:
${requirements}

Your goal: Build the project and validate it compiles without errors.
Run the build command and fix any TypeScript/syntax errors.

Use your runCommand tool to build the project.
If there are errors, use generateFiles to fix them and rebuild.
Complete this build task and confirm when successful.`,

        preview: `
👁️ PREVIEW TASK

Description: ${description}

Requirements:
${requirements}

Your goal: Prepare the project for preview.
Ensure the development server can start and the application is ready to view.

Use your runCommand tool if needed to verify the project is ready.
Complete this preview preparation and confirm when done.`,
    };

    return prompts[phase] || `
📋 TASK

Description: ${description}

Requirements:
${requirements}

Complete this task and confirm when done.`;
}
