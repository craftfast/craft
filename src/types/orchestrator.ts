/**
 * Multi-Agent Orchestration System - Type Definitions
 * Phase 3 Implementation
 */

// ============================================================================
// ORCHESTRATOR STATE
// ============================================================================

export interface OrchestratorState {
    sessionId: string;
    userId: string;
    projectId?: string;

    // Conversation
    conversationHistory: ConversationMessage[];

    // Task management
    tasks: TaskInfo[];
    currentTaskId?: string;
    completedTaskIds: string[];
    failedTaskIds: string[];

    // Project metadata
    projectName?: string;
    projectDescription?: string;
    requirements: string[];

    // Progress
    totalSteps: number;
    completedSteps: number;

    // Timestamps
    createdAt: Date;
    lastActive: Date;
}

export interface ConversationMessage {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
    metadata?: {
        taskId?: string;
        toolCalls?: string[];
        [key: string]: unknown;
    };
}

// ============================================================================
// TASK MANAGEMENT
// ============================================================================

export interface TaskInfo {
    id: string;
    phase: TaskPhase;
    description: string;
    status: TaskStatus;
    assignedTo: "orchestrator" | "coding-agent";
    tier?: "fast" | "expert";
    dependsOn: string[];
    result?: TaskResult;
    attempts: number;
    maxAttempts: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}

/**
 * HIGH-LEVEL task phases only
 * Orchestrator thinks in terms of project phases, not individual files
 */
export type TaskPhase =
    | "setup" // Setup sandbox environment (Node.js, pnpm)
    | "initialize" // Initialize project (create-next-app, etc.)
    | "implement" // Build features (entire feature, not individual files)
    | "build" // Build & validate (check for errors)
    | "preview"; // Trigger preview

export type TaskStatus = "pending" | "in-progress" | "completed" | "failed";

export interface TaskResult {
    success: boolean;
    filesCreated?: string[];
    filesModified?: string[];
    filesDeleted?: string[];
    commandOutput?: string;
    errors?: string[];
    warnings?: string[];
    metadata?: Record<string, unknown>;
}

export interface TaskContext {
    projectId: string;
    existingFiles?: string[];
    dependencies?: string[];
    requirements?: string[];
}

// ============================================================================
// DELEGATION
// ============================================================================

export interface DelegationRequest {
    taskId: string;
    task: TaskInfo;
    context: TaskContext;
    systemPrompt?: string;
    additionalInstructions?: string;
}

export interface DelegationResult {
    taskId: string;
    success: boolean;
    result?: TaskResult;
    error?: string;
    duration: number;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export interface ProgressReport {
    sessionId: string;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    currentTask?: TaskInfo;
    estimatedCompletion?: Date;
    percentComplete: number;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface TaskError {
    taskId: string;
    phase: TaskPhase;
    error: string;
    stackTrace?: string;
    recoverable: boolean;
    retryCount: number;
    maxRetries: number;
}

export interface ErrorRecoveryStrategy {
    action: "retry" | "skip" | "modify" | "abort";
    reason: string;
    modifications?: Record<string, unknown>;
}

// ============================================================================
// ORCHESTRATOR TOOLS
// ============================================================================

export interface CreateProjectToolInput {
    name: string;
    description?: string;
}

export interface CreateTaskListToolInput {
    userRequest: string;
    projectContext?: {
        existingFiles?: string[];
        dependencies?: string[];
    };
}

export interface DelegateTaskToolInput {
    taskId: string;
    tier?: "fast" | "expert";
    additionalContext?: string;
}

export interface UpdateTaskStatusToolInput {
    taskId: string;
    status: TaskStatus;
    result?: TaskResult;
    error?: string;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export interface SessionConfig {
    maxTasks?: number;
    maxRetries?: number;
    timeoutMs?: number;
    enableAutoRetry?: boolean;
    enableParallelExecution?: boolean;
}

export interface SessionMetrics {
    sessionId: string;
    duration: number;
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    totalTokensUsed: number;
    totalCost: number;
    averageTaskDuration: number;
}
