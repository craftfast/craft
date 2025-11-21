/**
 * Tool Execution Context
 * 
 * Provides context (SSE writer, project info, etc.) to tools during execution.
 * This is a temporary solution until AI SDK supports native tool context.
 */

import { SSEStreamWriter } from './sse-events';

interface ToolExecutionContext {
    sseWriter?: SSEStreamWriter;
    projectId?: string;
    userId?: string;
    sessionId?: string;
    sandboxId?: string; // Phase 3: E2B sandbox ID for the project
    onStatusUpdate?: (message: string, toolCallId?: string) => void; // For long-running operations
}

// Global registry of active tool execution contexts
// Maps toolCallId -> context
const activeToolContexts = new Map<string, ToolExecutionContext>();

// Current context for synchronous tool access
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
 * Register a specific tool call with context
 */
export function registerToolCall(toolCallId: string, context: ToolExecutionContext) {
    activeToolContexts.set(toolCallId, context);
}

/**
 * Get context for a specific tool call
 */
export function getToolCallContext(toolCallId: string): ToolExecutionContext | undefined {
    return activeToolContexts.get(toolCallId);
}

/**
 * Unregister a tool call context
 */
export function unregisterToolCall(toolCallId: string) {
    activeToolContexts.delete(toolCallId);
}

/**
 * Clean up old tool contexts (call after stream completes)
 */
export function cleanupToolContexts() {
    activeToolContexts.clear();
    currentContext = null;
}
