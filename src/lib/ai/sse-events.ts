/**
 * Server-Sent Events (SSE) utilities for real-time tool execution streaming
 * 
 * Event Types:
 * - text-delta: Streaming text content from AI
 * - tool-call-start: Tool execution started
 * - tool-call-complete: Tool execution finished (success or error)
 * - agent-phase: Agent loop phase transition (Think→Act→Observe→Reflect)
 * - agent-reasoning: Agent reasoning step
 * - agent-observation: Agent observation
 * - agent-reflection: Agent reflection
 * - done: Stream complete
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface TextDeltaEvent {
    type: 'text-delta';
    content: string;
}

export interface ToolCallStartEvent {
    type: 'tool-call-start';
    toolCall: {
        id: string;
        name: string;
        args: Record<string, unknown>;
        startedAt: number;
    };
}

export interface ToolCallCompleteEvent {
    type: 'tool-call-complete';
    toolCall: {
        id: string;
        name: string;
        status: 'success' | 'error';
        result?: unknown;
        error?: string;
        completedAt: number;
        duration: number;
    };
}

export interface DoneEvent {
    type: 'done';
    metadata?: {
        totalTokens?: number;
        inputTokens?: number;
        outputTokens?: number;
    };
}

export interface PreviewReadyEvent {
    type: 'preview-ready';
    projectId: string;
    filesGenerated: number;
    reason?: string;
    timestamp: number;
}

export interface FileStreamStartEvent {
    type: 'file-stream-start';
    file: {
        path: string;
        language?: string;
        isNew: boolean;
        toolCallId?: string;
    };
    timestamp: number;
}

export interface FileStreamDeltaEvent {
    type: 'file-stream-delta';
    file: {
        path: string;
        contentDelta: string;
        toolCallId?: string;
    };
    timestamp: number;
}

export interface FileStreamCompleteEvent {
    type: 'file-stream-complete';
    file: {
        path: string;
        content: string;
        language?: string;
        isNew: boolean;
        toolCallId?: string;
    };
    timestamp: number;
}

// ============================================================================
// AGENT LOOP EVENT TYPES (Phase 2)
// ============================================================================

export interface AgentPhaseEvent {
    type: 'agent-phase';
    phase: 'think' | 'act' | 'observe' | 'reflect';
    timestamp: number;
}

export interface AgentReasoningEvent {
    type: 'agent-reasoning';
    phase: 'think' | 'act' | 'observe' | 'reflect';
    content: string;
    timestamp: number;
}

export interface AgentObservationEvent {
    type: 'agent-observation';
    observationType: 'tool-result' | 'user-feedback' | 'error' | 'success';
    content: string;
    relatedToolId?: string;
    timestamp: number;
}

export interface AgentReflectionEvent {
    type: 'agent-reflection';
    insight: string;
    learnings: string[];
    suggestedActions?: string[];
    confidence: number;
    timestamp: number;
}

export interface StatusUpdateEvent {
    type: 'status-update';
    status: string;
    message: string;
    details?: string;
    toolCallId?: string;
    timestamp: number;
}

// ============================================================================
// SSE EVENT UNION TYPE
// ============================================================================

export type SSEEvent =
    | TextDeltaEvent
    | ToolCallStartEvent
    | ToolCallCompleteEvent
    | FileStreamStartEvent
    | FileStreamDeltaEvent
    | FileStreamCompleteEvent
    | AgentPhaseEvent
    | AgentReasoningEvent
    | AgentObservationEvent
    | AgentReflectionEvent
    | PreviewReadyEvent
    | StatusUpdateEvent
    | DoneEvent;

// ============================================================================
// SSE FORMATTING UTILITIES
// ============================================================================

/**
 * Format an event for SSE transmission
 * SSE format: "event: <type>\ndata: <json>\n\n"
 */
export function formatSSEEvent(event: SSEEvent): string {
    return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create a text delta event
 */
export function createTextDeltaEvent(content: string): TextDeltaEvent {
    return {
        type: 'text-delta',
        content,
    };
}

/**
 * Create a tool call start event
 */
export function createToolCallStartEvent(
    id: string,
    name: string,
    args: Record<string, unknown>
): ToolCallStartEvent {
    return {
        type: 'tool-call-start',
        toolCall: {
            id,
            name,
            args,
            startedAt: Date.now(),
        },
    };
}

/**
 * Create a tool call complete event
 */
export function createToolCallCompleteEvent(
    id: string,
    name: string,
    status: 'success' | 'error',
    options: {
        result?: unknown;
        error?: string;
        startedAt: number;
    }
): ToolCallCompleteEvent {
    const completedAt = Date.now();
    return {
        type: 'tool-call-complete',
        toolCall: {
            id,
            name,
            status,
            result: options.result,
            error: options.error,
            completedAt,
            duration: completedAt - options.startedAt,
        },
    };
}

/**
 * Create a done event
 */
export function createDoneEvent(metadata?: {
    totalTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
}): DoneEvent {
    return {
        type: 'done',
        metadata,
    };
}

// ============================================================================
// SSE STREAM WRITER
// ============================================================================

/**
 * Helper to write SSE events to a ReadableStream
 */
export class SSEStreamWriter {
    private encoder = new TextEncoder();
    private controller: ReadableStreamDefaultController | null = null;

    setController(controller: ReadableStreamDefaultController) {
        this.controller = controller;
    }

    write(event: SSEEvent) {
        if (!this.controller) {
            console.warn('SSEStreamWriter: No controller set');
            return;
        }

        const formatted = formatSSEEvent(event);
        this.controller.enqueue(this.encoder.encode(formatted));
    }

    writeTextDelta(content: string) {
        this.write(createTextDeltaEvent(content));
    }

    writeToolCallStart(id: string, name: string, args: Record<string, unknown>) {
        this.write(createToolCallStartEvent(id, name, args));
    }

    writeToolCallComplete(
        id: string,
        name: string,
        status: 'success' | 'error',
        options: { result?: unknown; error?: string; startedAt: number }
    ) {
        this.write(createToolCallCompleteEvent(id, name, status, options));
    }

    writeDone(metadata?: { totalTokens?: number; inputTokens?: number; outputTokens?: number }) {
        this.write(createDoneEvent(metadata));
    }

    writePreviewReady(projectId: string, filesGenerated: number, reason?: string) {
        this.write({
            type: 'preview-ready',
            projectId,
            filesGenerated,
            reason,
            timestamp: Date.now(),
        });
    }

    // ========================================================================
    // FILE STREAMING EVENTS
    // ========================================================================

    writeFileStreamStart(
        path: string,
        options: {
            language?: string;
            isNew: boolean;
            toolCallId?: string;
        }
    ) {
        this.write({
            type: 'file-stream-start',
            file: {
                path,
                language: options.language,
                isNew: options.isNew,
                toolCallId: options.toolCallId,
            },
            timestamp: Date.now(),
        });
    }

    writeFileStreamDelta(path: string, contentDelta: string, toolCallId?: string) {
        this.write({
            type: 'file-stream-delta',
            file: {
                path,
                contentDelta,
                toolCallId,
            },
            timestamp: Date.now(),
        });
    }

    writeFileStreamComplete(
        path: string,
        options: {
            content: string;
            language?: string;
            isNew: boolean;
            toolCallId?: string;
        }
    ) {
        this.write({
            type: 'file-stream-complete',
            file: {
                path,
                content: options.content,
                language: options.language,
                isNew: options.isNew,
                toolCallId: options.toolCallId,
            },
            timestamp: Date.now(),
        });
    }

    // ========================================================================
    // AGENT LOOP EVENTS (Phase 2)
    // ========================================================================

    writeAgentPhase(phase: 'think' | 'act' | 'observe' | 'reflect') {
        this.write({
            type: 'agent-phase',
            phase,
            timestamp: Date.now(),
        });
    }

    writeAgentReasoning(
        phase: 'think' | 'act' | 'observe' | 'reflect',
        content: string
    ) {
        this.write({
            type: 'agent-reasoning',
            phase,
            content,
            timestamp: Date.now(),
        });
    }

    writeAgentObservation(
        observationType: 'tool-result' | 'user-feedback' | 'error' | 'success',
        content: string,
        relatedToolId?: string
    ) {
        this.write({
            type: 'agent-observation',
            observationType,
            content,
            relatedToolId,
            timestamp: Date.now(),
        });
    }

    writeStatusUpdate(message: string, toolCallId?: string, details?: string) {
        this.write({
            type: 'status-update',
            status: 'running',
            message,
            details,
            toolCallId,
            timestamp: Date.now(),
        });
    }

    writeAgentReflection(
        insight: string,
        learnings: string[],
        suggestedActions?: string[],
        confidence: number = 0.5
    ) {
        this.write({
            type: 'agent-reflection',
            insight,
            learnings,
            suggestedActions,
            confidence: Math.max(0, Math.min(1, confidence)),
            timestamp: Date.now(),
        });
    }

    // ========================================================================
    // ORCHESTRATOR EVENTS (Phase 3)
    // ========================================================================

    writeOrchestratorSession(sessionId: string, status: string) {
        this.write({
            type: 'orchestrator-session',
            sessionId,
            status,
            timestamp: Date.now(),
        } as unknown as SSEEvent);
    }

    writeOrchestratorStep(stepType: string, toolCalls: number) {
        this.write({
            type: 'orchestrator-step',
            stepType,
            toolCalls,
            timestamp: Date.now(),
        } as unknown as SSEEvent);
    }

    writeOrchestratorPlanning(status: string) {
        this.write({
            type: 'orchestrator-planning',
            status,
            timestamp: Date.now(),
        } as unknown as SSEEvent);
    }

    writeOrchestratorDelegation(taskId: string) {
        this.write({
            type: 'orchestrator-delegation',
            taskId,
            timestamp: Date.now(),
        } as unknown as SSEEvent);
    }

    writeOrchestratorTaskCreated(taskId: string, description: string) {
        this.write({
            type: 'orchestrator-task-created',
            taskId,
            description,
            timestamp: Date.now(),
        } as unknown as SSEEvent);
    }

    writeOrchestratorTaskCompleted(taskId: string, success: boolean) {
        this.write({
            type: 'orchestrator-task-completed',
            taskId,
            success,
            timestamp: Date.now(),
        } as unknown as SSEEvent);
    }

    writeOrchestratorProgress(
        totalTasks: number,
        completedTasks: number,
        failedTasks: number,
        percentComplete: number
    ) {
        this.write({
            type: 'orchestrator-progress',
            totalTasks,
            completedTasks,
            failedTasks,
            percentComplete,
            timestamp: Date.now(),
        } as unknown as SSEEvent);
    }

    close() {
        if (this.controller) {
            this.controller.close();
        }
    }
}
