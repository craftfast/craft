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
 * Key structure: craft:tool-context:{sessionId}:{toolCallId}
 * This allows efficient cleanup by session without N+1 queries
 */
export async function registerToolCall(toolCallId: string, context: ToolExecutionContext): Promise<void> {
    try {
        // Include sessionId in key for efficient pattern-based deletion
        const sessionId = context.sessionId || 'unknown';
        const key = `${TOOL_CONTEXT_PREFIX}:${sessionId}:${toolCallId}`;

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
 * Note: Since we don't know the sessionId here, we need to scan
 * This is only called rarely (for debugging/monitoring)
 */
export async function getToolCallContext(toolCallId: string): Promise<SerializableToolContext | null> {
    try {
        // Search for the key across all sessions
        const pattern = `${TOOL_CONTEXT_PREFIX}:*:${toolCallId}`;
        const keys = await redis.keys(pattern);

        if (keys.length === 0) {
            return null;
        }

        // Get the first matching key (should only be one)
        const data = await redis.get<string>(keys[0]);
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
 * Note: Since we don't know the sessionId here, we need to scan
 */
export async function unregisterToolCall(toolCallId: string): Promise<void> {
    try {
        // Search for the key across all sessions
        const pattern = `${TOOL_CONTEXT_PREFIX}:*:${toolCallId}`;
        const keys = await redis.keys(pattern);

        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        console.error(`Failed to unregister tool context for ${toolCallId}:`, error);
    }
}

/**
 * Clean up old tool contexts (call after stream completes)
 * Efficiently deletes all contexts for a session using pattern matching
 */
export async function cleanupToolContexts(sessionId?: string): Promise<void> {
    currentContext = null;

    if (sessionId) {
        try {
            // Clean up all tool contexts for this session using pattern matching
            // Key structure: craft:tool-context:{sessionId}:{toolCallId}
            const pattern = `${TOOL_CONTEXT_PREFIX}:${sessionId}:*`;
            const keys = await redis.keys(pattern);

            if (keys.length > 0) {
                await redis.del(...keys);
                console.log(`✅ Cleaned up ${keys.length} tool contexts for session ${sessionId}`);
            }
        } catch (error) {
            console.error("Failed to cleanup tool contexts:", error);
        }
    }
}
