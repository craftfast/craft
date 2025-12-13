/**
 * Tool Execution Context (Redis-backed)
 * 
 * Provides context (SSE writer, project info, etc.) to tools during execution.
 * Uses Redis for distributed storage across Vercel instances.
 */

import { SSEStreamWriter } from './sse-events';
import { redis, REDIS_PREFIXES, REDIS_TTL } from "../redis-client";

interface ToolExecutionContext {
    sseWriter?: SSEStreamWriter;
    projectId?: string;
    userId?: string;
    sessionId?: string;
    sandboxId?: string; // Phase 3: E2B sandbox ID for the project
    onStatusUpdate?: (message: string, toolCallId?: string) => void; // For long-running operations
}

// Serializable version (without functions)
interface SerializableToolContext {
    projectId?: string;
    userId?: string;
    sessionId?: string;
    sandboxId?: string;
}

const TOOL_CONTEXT_PREFIX = REDIS_PREFIXES.TOOL_CONTEXT;
const TOOL_CONTEXT_TTL = REDIS_TTL.TOOL_CONTEXT;

// Current context for synchronous tool access (in-memory only, not shared)
let currentContext: ToolExecutionContext | null = null;

/**
 * Set the current tool execution context
 * Called before each tool execution round
 */
export function setToolContext(context: ToolExecutionContext) {
    currentContext = context;
}

/**
 * Get the current tool execution context
 * Called by tools during execution
 */
export function getToolContext(): ToolExecutionContext | null {
    return currentContext;
}

/**
 * Clear the current tool execution context
 */
export function clearToolContext() {
    currentContext = null;
}

/**
 * Register a specific tool call with context (Redis-backed)
 */
export async function registerToolCall(toolCallId: string, context: ToolExecutionContext): Promise<void> {
    try {
        const key = `${TOOL_CONTEXT_PREFIX}:${toolCallId}`;

        // Store only serializable data in Redis
        const serializable: SerializableToolContext = {
            projectId: context.projectId,
            userId: context.userId,
            sessionId: context.sessionId,
            sandboxId: context.sandboxId,
        };

        await redis.set(key, JSON.stringify(serializable), { ex: TOOL_CONTEXT_TTL });
    } catch (error) {
        console.error(`Failed to register tool context for ${toolCallId}:`, error);
    }
}

/**
 * Get context for a specific tool call (from Redis)
 */
export async function getToolCallContext(toolCallId: string): Promise<SerializableToolContext | null> {
    try {
        const key = `${TOOL_CONTEXT_PREFIX}:${toolCallId}`;
        const data = await redis.get<string>(key);

        if (!data) {
            return null;
        }

        return JSON.parse(data) as SerializableToolContext;
    } catch (error) {
        console.error(`Failed to get tool context for ${toolCallId}:`, error);
        return null;
    }
}

/**
 * Unregister a tool call context (from Redis)
 */
export async function unregisterToolCall(toolCallId: string): Promise<void> {
    try {
        const key = `${TOOL_CONTEXT_PREFIX}:${toolCallId}`;
        await redis.del(key);
    } catch (error) {
        console.error(`Failed to unregister tool context for ${toolCallId}:`, error);
    }
}

/**
 * Clean up old tool contexts (call after stream completes)
 */
export async function cleanupToolContexts(sessionId?: string): Promise<void> {
    currentContext = null;

    if (sessionId) {
        try {
            // Clean up all tool contexts for this session
            const pattern = `${TOOL_CONTEXT_PREFIX}:*`;
            const keys = await redis.keys(pattern);

            const keysToDelete: string[] = [];
            for (const key of keys) {
                const data = await redis.get<string>(key);
                if (data) {
                    const context = JSON.parse(data) as SerializableToolContext;
                    if (context.sessionId === sessionId) {
                        keysToDelete.push(key);
                    }
                }
            }

            if (keysToDelete.length > 0) {
                await redis.del(...keysToDelete);
            }
        } catch (error) {
            console.error("Failed to cleanup tool contexts:", error);
        }
    }
}
