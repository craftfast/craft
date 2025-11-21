/**
 * Agent Loop System - Phase 2: Multi-Step Reasoning
 * 
 * Implements the Think→Act→Observe→Reflect pattern for complex task execution.
 * 
 * ARCHITECTURE:
 * - Think: Agent plans what actions to take before executing
 * - Act: Agent executes tools and generates responses
 * - Observe: Agent analyzes results and checks for errors
 * - Reflect: Agent learns from outcomes and adjusts strategy
 * 
 * STATE MANAGEMENT:
 * - Tracks all reasoning steps across turns
 * - Maintains tool execution history and dependencies
 * - Persists conversation context for multi-step workflows
 * - Enables state restoration and replay
 */

// ============================================================================
// TYPES
// ============================================================================

export type AgentLoopPhase = 'think' | 'act' | 'observe' | 'reflect';

export interface ReasoningStep {
    id: string;
    phase: AgentLoopPhase;
    timestamp: number;
    content: string;
    metadata?: Record<string, unknown>;
}

export interface ToolExecution {
    id: string;
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
    error?: string;
    status: 'pending' | 'running' | 'success' | 'error';
    startedAt: number;
    completedAt?: number;
    duration?: number;
    dependencies?: string[]; // IDs of tools this depends on
}

export interface Observation {
    id: string;
    timestamp: number;
    type: 'tool-result' | 'user-feedback' | 'error' | 'success';
    content: string;
    relatedToolId?: string;
    metadata?: Record<string, unknown>;
}

export interface Reflection {
    id: string;
    timestamp: number;
    insight: string;
    learnings: string[];
    suggestedActions?: string[];
    confidence: number; // 0-1
}

export interface AgentLoopState {
    sessionId: string;
    projectId: string;
    userId: string;

    // Current execution state
    currentPhase: AgentLoopPhase;
    isActive: boolean;

    // Reasoning chain
    reasoningSteps: ReasoningStep[];

    // Tool execution tracking
    toolExecutions: ToolExecution[];
    pendingTools: string[]; // Tool IDs waiting to execute

    // Observations and learning
    observations: Observation[];
    reflections: Reflection[];

    // Context
    conversationHistory: Array<{ role: string; content: string }>;
    projectFiles: Record<string, string>;

    // Metadata
    createdAt: number;
    updatedAt: number;
    turnCount: number;
}

// ============================================================================
// STATE MANAGER
// ============================================================================

export class AgentLoopStateManager {
    private state: AgentLoopState;

    constructor(initialState: Partial<AgentLoopState>) {
        this.state = {
            sessionId: initialState.sessionId || this.generateId(),
            projectId: initialState.projectId || '',
            userId: initialState.userId || '',
            currentPhase: initialState.currentPhase || 'think',
            isActive: initialState.isActive ?? false,
            reasoningSteps: initialState.reasoningSteps || [],
            toolExecutions: initialState.toolExecutions || [],
            pendingTools: initialState.pendingTools || [],
            observations: initialState.observations || [],
            reflections: initialState.reflections || [],
            conversationHistory: initialState.conversationHistory || [],
            projectFiles: initialState.projectFiles || {},
            createdAt: initialState.createdAt || Date.now(),
            updatedAt: Date.now(),
            turnCount: initialState.turnCount || 0,
        };
    }

    // ========================================================================
    // STATE ACCESSORS
    // ========================================================================

    getState(): AgentLoopState {
        return { ...this.state };
    }

    getCurrentPhase(): AgentLoopPhase {
        return this.state.currentPhase;
    }

    isLoopActive(): boolean {
        return this.state.isActive;
    }

    // ========================================================================
    // PHASE MANAGEMENT
    // ========================================================================

    setPhase(phase: AgentLoopPhase) {
        this.state.currentPhase = phase;
        this.state.updatedAt = Date.now();
    }

    startLoop() {
        this.state.isActive = true;
        this.state.currentPhase = 'think';
        this.state.turnCount += 1;
        this.state.updatedAt = Date.now();
    }

    stopLoop() {
        this.state.isActive = false;
        this.state.updatedAt = Date.now();
    }

    // ========================================================================
    // REASONING STEPS
    // ========================================================================

    addReasoningStep(phase: AgentLoopPhase, content: string, metadata?: Record<string, unknown>): ReasoningStep {
        const step: ReasoningStep = {
            id: this.generateId(),
            phase,
            timestamp: Date.now(),
            content,
            metadata,
        };

        this.state.reasoningSteps.push(step);
        this.state.updatedAt = Date.now();

        return step;
    }

    getReasoningSteps(phase?: AgentLoopPhase): ReasoningStep[] {
        if (phase) {
            return this.state.reasoningSteps.filter(step => step.phase === phase);
        }
        return [...this.state.reasoningSteps];
    }

    getLatestReasoningStep(phase?: AgentLoopPhase): ReasoningStep | undefined {
        const steps = this.getReasoningSteps(phase);
        return steps[steps.length - 1];
    }

    // ========================================================================
    // TOOL EXECUTION TRACKING
    // ========================================================================

    trackToolStart(
        name: string,
        args: Record<string, unknown>,
        dependencies?: string[]
    ): ToolExecution {
        const execution: ToolExecution = {
            id: this.generateId(),
            name,
            args,
            status: 'running',
            startedAt: Date.now(),
            dependencies,
        };

        this.state.toolExecutions.push(execution);
        this.state.pendingTools = this.state.pendingTools.filter(id => id !== execution.id);
        this.state.updatedAt = Date.now();

        return execution;
    }

    trackToolComplete(
        id: string,
        result?: unknown,
        error?: string
    ) {
        const execution = this.state.toolExecutions.find(e => e.id === id);
        if (!execution) return;

        execution.status = error ? 'error' : 'success';
        execution.result = result;
        execution.error = error;
        execution.completedAt = Date.now();
        execution.duration = execution.completedAt - execution.startedAt;

        this.state.updatedAt = Date.now();
    }

    getToolExecutions(status?: ToolExecution['status']): ToolExecution[] {
        if (status) {
            return this.state.toolExecutions.filter(e => e.status === status);
        }
        return [...this.state.toolExecutions];
    }

    getToolExecution(id: string): ToolExecution | undefined {
        return this.state.toolExecutions.find(e => e.id === id);
    }

    // ========================================================================
    // OBSERVATIONS
    // ========================================================================

    addObservation(
        type: Observation['type'],
        content: string,
        relatedToolId?: string,
        metadata?: Record<string, unknown>
    ): Observation {
        const observation: Observation = {
            id: this.generateId(),
            timestamp: Date.now(),
            type,
            content,
            relatedToolId,
            metadata,
        };

        this.state.observations.push(observation);
        this.state.updatedAt = Date.now();

        return observation;
    }

    getObservations(type?: Observation['type']): Observation[] {
        if (type) {
            return this.state.observations.filter(o => o.type === type);
        }
        return [...this.state.observations];
    }

    // ========================================================================
    // REFLECTIONS
    // ========================================================================

    addReflection(
        insight: string,
        learnings: string[],
        suggestedActions?: string[],
        confidence: number = 0.5
    ): Reflection {
        const reflection: Reflection = {
            id: this.generateId(),
            timestamp: Date.now(),
            insight,
            learnings,
            suggestedActions,
            confidence: Math.max(0, Math.min(1, confidence)),
        };

        this.state.reflections.push(reflection);
        this.state.updatedAt = Date.now();

        return reflection;
    }

    getReflections(): Reflection[] {
        return [...this.state.reflections];
    }

    getLatestReflection(): Reflection | undefined {
        return this.state.reflections[this.state.reflections.length - 1];
    }

    // ========================================================================
    // CONTEXT MANAGEMENT
    // ========================================================================

    updateConversationHistory(messages: Array<{ role: string; content: string }>) {
        this.state.conversationHistory = messages;
        this.state.updatedAt = Date.now();
    }

    updateProjectFiles(files: Record<string, string>) {
        this.state.projectFiles = files;
        this.state.updatedAt = Date.now();
    }

    // ========================================================================
    // TOOL DEPENDENCY ANALYSIS
    // ========================================================================

    /**
     * Analyze tool dependencies and create execution plan
     */
    analyzeDependencies(): Map<string, string[]> {
        const dependencyGraph = new Map<string, string[]>();

        for (const execution of this.state.toolExecutions) {
            if (execution.dependencies && execution.dependencies.length > 0) {
                dependencyGraph.set(execution.id, execution.dependencies);
            }
        }

        return dependencyGraph;
    }

    /**
     * Get tools that are ready to execute (all dependencies met)
     */
    getReadyTools(): ToolExecution[] {
        const completedIds = new Set(
            this.state.toolExecutions
                .filter(e => e.status === 'success')
                .map(e => e.id)
        );

        return this.state.toolExecutions.filter(execution => {
            if (execution.status !== 'pending') return false;

            if (!execution.dependencies || execution.dependencies.length === 0) {
                return true;
            }

            return execution.dependencies.every(depId => completedIds.has(depId));
        });
    }

    // ========================================================================
    // SERIALIZATION
    // ========================================================================

    toJSON(): string {
        return JSON.stringify(this.state);
    }

    static fromJSON(json: string): AgentLoopStateManager {
        const state = JSON.parse(json) as AgentLoopState;
        return new AgentLoopStateManager(state);
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Get a summary of the current state for display
     */
    getSummary(): {
        phase: AgentLoopPhase;
        turnCount: number;
        totalReasoningSteps: number;
        totalToolExecutions: number;
        successfulTools: number;
        failedTools: number;
        totalObservations: number;
        totalReflections: number;
    } {
        return {
            phase: this.state.currentPhase,
            turnCount: this.state.turnCount,
            totalReasoningSteps: this.state.reasoningSteps.length,
            totalToolExecutions: this.state.toolExecutions.length,
            successfulTools: this.state.toolExecutions.filter(e => e.status === 'success').length,
            failedTools: this.state.toolExecutions.filter(e => e.status === 'error').length,
            totalObservations: this.state.observations.length,
            totalReflections: this.state.reflections.length,
        };
    }
}

// ============================================================================
// GLOBAL STATE REGISTRY
// ============================================================================

/**
 * Global registry of active agent loop states
 * Maps sessionId -> AgentLoopStateManager
 */
export const activeAgentLoops = new Map<string, AgentLoopStateManager>();

/**
 * Get or create an agent loop state for a session
 */
export function getAgentLoopState(
    sessionId: string,
    initialData?: Partial<AgentLoopState>
): AgentLoopStateManager {
    let manager = activeAgentLoops.get(sessionId);

    if (!manager) {
        manager = new AgentLoopStateManager({
            sessionId,
            ...initialData,
        });
        activeAgentLoops.set(sessionId, manager);
    }

    return manager;
}

/**
 * Clean up inactive agent loop states (older than 30 minutes)
 */
export function cleanupInactiveAgentLoops() {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000; // Changed from 1 hour to 30 minutes

    for (const [sessionId, manager] of activeAgentLoops.entries()) {
        const state = manager.getState();
        if (!state.isActive && state.updatedAt < thirtyMinutesAgo) {
            activeAgentLoops.delete(sessionId);
            console.log(`🧹 Cleaned up inactive agent loop: ${sessionId}`);
        }
    }
}

// Clean up every 10 minutes
setInterval(cleanupInactiveAgentLoops, 10 * 60 * 1000);
