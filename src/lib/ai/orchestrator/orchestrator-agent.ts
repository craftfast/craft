/**
 * Orchestrator Agent - Multi-Agent System
 * Phase 3 Implementation
 * 
 * The orchestrator uses Grok 4 Fast for:
 * - Understanding user intent
 * - Creating projects and generating names
 * - Planning high-level phases (NOT individual files)
 * - Delegating tasks to coding agent
 * - Tracking progress and handling errors
 */

import { streamText, generateText } from "ai";
import { createXai } from "@ai-sdk/xai";
import { SessionManager } from "./session-manager";
import { TaskManager } from "./task-manager";
import { executeTaskWithCodingAgent } from "./delegation";
import { getOrchestratorSystemPrompt } from "../orchestrator-prompts";
import { orchestratorTools } from "../orchestrator-tools";
import { SSEStreamWriter } from "../sse-events";
import { getPostHogClient, withTracing, createTracingOptions } from "@/lib/posthog-server";
import type { OrchestratorState } from "@/types/orchestrator";

const xai = createXai({
    apiKey: process.env.XAI_API_KEY || "",
});

interface OrchestratorOptions {
    userId: string;
    projectId?: string;
    sessionId?: string;
    sseWriter?: SSEStreamWriter;
    onTaskCreated?: (taskId: string, description: string) => void;
    onTaskDelegated?: (taskId: string) => void;
    onTaskCompleted?: (taskId: string, success: boolean) => void;
}

export class OrchestratorAgent {
    private state: OrchestratorState | null = null;
    private userId: string;
    private projectId?: string;
    private sseWriter?: SSEStreamWriter;

    constructor(private options: OrchestratorOptions) {
        this.userId = options.userId;
        this.projectId = options.projectId;
        this.sseWriter = options.sseWriter;
    }

    /**
     * Initialize or resume session
     */
    async initialize(): Promise<void> {
        console.log("🎯 Initializing orchestrator agent");

        // Load or create session
        this.state = await SessionManager.loadOrCreate(
            this.userId,
            this.options.projectId
        );

        console.log(`📂 Session: ${this.state!.sessionId}`);

        // Emit session started event
        this.sseWriter?.writeOrchestratorSession(
            this.state!.sessionId,
            "active"
        );
    }

    /**
     * Process user message and orchestrate the workflow
     */
    async processMessage(userMessage: string) {
        if (!this.state) {
            await this.initialize();
        }

        console.log(`💬 Processing message: ${userMessage.substring(0, 100)}...`);

        // Add user message to conversation history
        await SessionManager.addMessage(
            this.state!.sessionId,
            "user",
            userMessage
        );

        // Get system prompt with current state
        const systemPrompt = getOrchestratorSystemPrompt(this.state!);

        // Prepare messages for AI
        const messages = [
            {
                role: "system" as const,
                content: systemPrompt,
            },
            ...this.state!.conversationHistory.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
        ];

        // Use Grok 4 Fast for orchestration
        const baseModel = xai("grok-4-fast");

        // Wrap model with PostHog tracing for LLM analytics
        const posthogClient = getPostHogClient();
        const model = posthogClient
            ? withTracing(baseModel, posthogClient, {
                ...createTracingOptions(this.userId, this.projectId, {
                    modelId: "x-ai/grok-4-fast",
                    agentType: "orchestrator",
                }),
            })
            : baseModel;

        try {
            // Stream orchestrator's response
            const result = await streamText({
                model,
                messages,
                tools: orchestratorTools,
                onStepFinish: async (step) => {
                    console.log(`🔄 Step finished:`, step);

                    // Emit step events
                    this.sseWriter?.writeOrchestratorStep(
                        "tool-call",
                        step.toolCalls?.length || 0
                    );

                    // Handle tool call results
                    if (step.toolCalls && step.toolResults) {
                        for (let i = 0; i < step.toolCalls.length; i++) {
                            const toolCall = step.toolCalls[i];
                            const toolResult = step.toolResults[i];

                            console.log(`🔧 Tool: ${toolCall.toolName}`);

                            // Emit tool-specific events
                            if (toolCall.toolName === "createTaskList") {
                                this.sseWriter?.writeOrchestratorPlanning("creating-tasks");
                            } else if (toolCall.toolName === "delegateTaskToCodingAgent") {
                                // Execute the task with coding agent
                                const args = (toolCall as any).args as { taskId: string; requirements: string };
                                const result = (toolResult as any).result as {
                                    success: boolean;
                                    taskId?: string;
                                    taskPhase?: string;
                                    taskDescription?: string;
                                    requirements?: string;
                                };

                                if (result.success && result.taskId && result.taskPhase && result.requirements) {
                                    // Execute task asynchronously (don't block orchestrator)
                                    executeTaskWithCodingAgent({
                                        sessionId: this.state!.sessionId,
                                        taskId: result.taskId,
                                        taskPhase: result.taskPhase as any,
                                        taskDescription: result.taskDescription || '',
                                        requirements: result.requirements,
                                        userId: this.userId,
                                        projectId: this.projectId,
                                        projectFiles: {},
                                        sseWriter: this.sseWriter!,
                                        tier: 'fast',
                                    }).catch(err => {
                                        console.error(`❌ Task execution failed:`, err);
                                    });
                                }
                            }
                        }
                    }
                },
            });

            // Stream the response
            return result.textStream;
        } catch (error) {
            console.error("❌ Orchestrator error:", error);

            // Save error to conversation
            await SessionManager.addMessage(
                this.state!.sessionId,
                "assistant",
                `Error: ${error instanceof Error ? error.message : "Unknown error"}`
            );

            throw error;
        }
    }

    /**
     * Get current session state
     */
    getState(): OrchestratorState | null {
        return this.state;
    }

    /**
     * Get session progress
     */
    async getProgress() {
        if (!this.state) {
            return null;
        }

        return await TaskManager.getProgress(this.state.sessionId);
    }

    /**
     * Check if all tasks are complete
     */
    async isComplete(): Promise<boolean> {
        if (!this.state) {
            return false;
        }

        return await TaskManager.areAllTasksComplete(this.state.sessionId);
    }

    /**
     * Save current state to database
     */
    async saveState(): Promise<void> {
        if (!this.state) {
            return;
        }

        await SessionManager.save(this.state);
    }
}

/**
 * Helper function to create and initialize orchestrator
 */
export async function createOrchestrator(
    options: OrchestratorOptions
): Promise<OrchestratorAgent> {
    const orchestrator = new OrchestratorAgent(options);
    await orchestrator.initialize();
    return orchestrator;
}

/**
 * Simple orchestrator execution for non-streaming use cases
 */
export async function executeOrchestrator(
    userId: string,
    userMessage: string,
    projectId?: string
): Promise<string> {
    const orchestrator = new OrchestratorAgent({ userId, projectId });
    await orchestrator.initialize();

    const state = orchestrator.getState();
    if (!state) {
        throw new Error("Failed to initialize orchestrator");
    }

    // Add user message
    await SessionManager.addMessage(state.sessionId, "user", userMessage);

    // Get system prompt
    const systemPrompt = getOrchestratorSystemPrompt(state);

    // Prepare messages
    const messages = [
        {
            role: "system" as const,
            content: systemPrompt,
        },
        ...state.conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
        })),
    ];

    // Generate response
    const baseModel = xai("grok-4-fast");

    // Wrap model with PostHog tracing for LLM analytics
    const posthogClient = getPostHogClient();
    const model = posthogClient
        ? withTracing(baseModel, posthogClient, {
            ...createTracingOptions(userId, projectId, {
                modelId: "x-ai/grok-4-fast",
                agentType: "orchestrator",
            }),
        })
        : baseModel;

    const result = await generateText({
        model,
        messages,
        tools: orchestratorTools,
    });

    // Save assistant response
    await SessionManager.addMessage(state.sessionId, "assistant", result.text);

    return result.text;
}
