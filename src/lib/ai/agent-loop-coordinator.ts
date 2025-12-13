/**
 * Agent Loop Coordinator - Phase 2 Implementation
 * 
 * Orchestrates the Think→Act→Observe→Reflect cycle for complex task execution.
 * 
 * WORKFLOW:
 * 1. THINK: Agent analyzes the task and plans what tools to use
 * 2. ACT: Agent executes the planned tools
 * 3. OBSERVE: Agent examines the results and checks for issues
 * 4. REFLECT: Agent learns from the outcome and decides next steps
 * 
 * This coordinator enhances the base agent with multi-step reasoning capabilities.
 */

import { SSEStreamWriter } from './sse-events';
import {
    AgentLoopStateManager,
    getAgentLoopState,
    type AgentLoopState,
} from './agent-loop';

// ============================================================================
// AGENT LOOP COORDINATOR
// ============================================================================

interface AgentLoopOptions {
    sessionId: string;
    projectId: string;
    userId: string;
    userMessage: string;
    projectFiles?: Record<string, string>;
    conversationHistory?: Array<{ role: string; content: string }>;
    sseWriter?: SSEStreamWriter;
}

export class AgentLoopCoordinator {
    private stateManager!: AgentLoopStateManager;
    private sseWriter?: SSEStreamWriter;
    private initPromise: Promise<void>;

    constructor(options: AgentLoopOptions) {
        // Initialize state manager asynchronously
        this.initPromise = this.initialize(options);
        this.sseWriter = options.sseWriter;
    }

    private async initialize(options: AgentLoopOptions) {
        // Get or create agent loop state from Redis
        this.stateManager = await getAgentLoopState(options.sessionId, {
            projectId: options.projectId,
            userId: options.userId,
            projectFiles: options.projectFiles || {},
            conversationHistory: options.conversationHistory || [],
        });
    }

    async ensureInitialized() {
        await this.initPromise;
    }

    // ========================================================================
    // MAIN LOOP EXECUTION
    // ========================================================================

    /**
     * Execute a single turn of the agent loop
     */
    async executeTurn(userMessage: string): Promise<{
        shouldContinue: boolean;
        nextAction?: string;
    }> {
        // Ensure initialized
        await this.ensureInitialized();

        // Start the loop
        this.stateManager.startLoop();

        try {
            // 1. THINK: Plan what to do
            await this.think(userMessage);

            // 2. ACT: Execute planned actions
            const actResult = await this.act();

            // 3. OBSERVE: Analyze results
            const observations = await this.observe(actResult);

            // 4. REFLECT: Learn and decide next steps
            const reflection = await this.reflect(observations);

            // Determine if we should continue
            return {
                shouldContinue: reflection.shouldContinue,
                nextAction: reflection.nextAction,
            };
        } catch (error) {
            console.error('❌ Agent loop error:', error);
            this.stateManager.stopLoop();

            // Emit error observation
            this.stateManager.addObservation(
                'error',
                error instanceof Error ? error.message : 'Unknown error'
            );

            if (this.sseWriter) {
                this.sseWriter.writeAgentObservation(
                    'error',
                    error instanceof Error ? error.message : 'Unknown error'
                );
            }

            return { shouldContinue: false };
        }
    }

    // ========================================================================
    // THINK PHASE
    // ========================================================================

    /**
     * THINK: Analyze the task and plan actions
     */
    private async think(userMessage: string): Promise<void> {
        console.log('🤔 THINK: Planning actions...');

        // Transition to think phase
        this.stateManager.setPhase('think');
        if (this.sseWriter) {
            this.sseWriter.writeAgentPhase('think');
        }

        // Analyze the user's request
        const thinkingSteps = await this.analyzeTask(userMessage);

        // Add reasoning steps
        for (const step of thinkingSteps) {
            this.stateManager.addReasoningStep('think', step);
            if (this.sseWriter) {
                this.sseWriter.writeAgentReasoning('think', step);
            }
            console.log(`  💭 ${step}`);
        }
    }

    /**
     * Analyze the task and break it down into steps
     */
    private async analyzeTask(userMessage: string): Promise<string[]> {
        const steps: string[] = [];
        const message = userMessage.toLowerCase();

        // Basic task analysis patterns
        // In a real implementation, you might use an LLM to analyze this

        // Check for file operations
        if (message.includes('create') || message.includes('add') || message.includes('generate')) {
            steps.push('User wants to create new files or features');
            steps.push('Need to check existing project structure first (listFiles)');
            steps.push('May need to read existing files to understand context (readFile)');
            steps.push('Then generate the new code (generateFiles)');
        }

        // Check for modifications
        if (message.includes('update') || message.includes('modify') || message.includes('change') || message.includes('fix')) {
            steps.push('User wants to modify existing code');
            steps.push('Need to read the files that need modification (readFile)');
            steps.push('Then update them with changes (generateFiles)');
        }

        // Check for debugging/analysis
        if (message.includes('error') || message.includes('bug') || message.includes('issue') || message.includes('problem')) {
            steps.push('User is reporting an issue');
            steps.push('Need to search for relevant code (searchCode)');
            steps.push('May need to check command output or logs');
        }

        // Check for installation/setup
        if (message.includes('install') || message.includes('setup') || message.includes('configure')) {
            steps.push('User wants to install or configure something');
            steps.push('Need to check package.json or config files (readFile)');
            steps.push('May need to run installation commands (runCommand)');
        }

        // Default fallback
        if (steps.length === 0) {
            steps.push('Analyzing user request...');
            steps.push('Will determine appropriate tools to use');
        }

        return steps;
    }

    // ========================================================================
    // ACT PHASE
    // ========================================================================

    /**
     * ACT: Execute the planned actions
     */
    private async act(): Promise<Map<string, unknown>> {
        console.log('⚡ ACT: Executing actions...');

        // Transition to act phase
        this.stateManager.setPhase('act');
        if (this.sseWriter) {
            this.sseWriter.writeAgentPhase('act');
        }

        const results = new Map<string, unknown>();

        // Add reasoning for act phase
        const actStep = 'Executing planned tools and generating response...';
        this.stateManager.addReasoningStep('act', actStep);
        if (this.sseWriter) {
            this.sseWriter.writeAgentReasoning('act', actStep);
        }

        // Note: The actual tool execution happens in the streamCodingResponse
        // This phase is for coordination and tracking

        return results;
    }

    // ========================================================================
    // OBSERVE PHASE
    // ========================================================================

    /**
     * OBSERVE: Analyze the results of actions
     */
    private async observe(actResults: Map<string, unknown>): Promise<string[]> {
        console.log('👀 OBSERVE: Analyzing results...');

        // Transition to observe phase
        this.stateManager.setPhase('observe');
        if (this.sseWriter) {
            this.sseWriter.writeAgentPhase('observe');
        }

        const observations: string[] = [];

        // Get tool execution results from state
        const toolExecutions = this.stateManager.getToolExecutions();
        const successfulTools = toolExecutions.filter(t => t.status === 'success');
        const failedTools = toolExecutions.filter(t => t.status === 'error');

        // Observe successful tool executions
        if (successfulTools.length > 0) {
            const successMsg = `Successfully executed ${successfulTools.length} tool(s): ${successfulTools.map(t => t.name).join(', ')}`;
            observations.push(successMsg);

            this.stateManager.addObservation('success', successMsg);
            if (this.sseWriter) {
                this.sseWriter.writeAgentObservation('success', successMsg);
            }
        }

        // Observe failed tool executions
        if (failedTools.length > 0) {
            const errorMsg = `${failedTools.length} tool(s) failed: ${failedTools.map(t => `${t.name} (${t.error})`).join(', ')}`;
            observations.push(errorMsg);

            this.stateManager.addObservation('error', errorMsg);
            if (this.sseWriter) {
                this.sseWriter.writeAgentObservation('error', errorMsg);
            }
        }

        // If no tools were executed
        if (toolExecutions.length === 0) {
            const noToolsMsg = 'No tools were executed - responded with text only';
            observations.push(noToolsMsg);

            this.stateManager.addObservation('tool-result', noToolsMsg);
            if (this.sseWriter) {
                this.sseWriter.writeAgentObservation('tool-result', noToolsMsg);
            }
        }

        // Add reasoning steps for observations
        for (const obs of observations) {
            this.stateManager.addReasoningStep('observe', obs);
            if (this.sseWriter) {
                this.sseWriter.writeAgentReasoning('observe', obs);
            }
            console.log(`  👁️ ${obs}`);
        }

        return observations;
    }

    // ========================================================================
    // REFLECT PHASE
    // ========================================================================

    /**
     * REFLECT: Learn from results and decide next steps
     */
    private async reflect(observations: string[]): Promise<{
        shouldContinue: boolean;
        nextAction?: string;
    }> {
        console.log('🎯 REFLECT: Learning from results...');

        // Transition to reflect phase
        this.stateManager.setPhase('reflect');
        if (this.sseWriter) {
            this.sseWriter.writeAgentPhase('reflect');
        }

        // Analyze what happened
        const toolExecutions = this.stateManager.getToolExecutions();
        const hasErrors = toolExecutions.some(t => t.status === 'error');
        const hasSuccess = toolExecutions.some(t => t.status === 'success');

        // Generate learnings
        const learnings: string[] = [];
        let confidence = 0.5;

        if (hasSuccess && !hasErrors) {
            learnings.push('All tools executed successfully');
            learnings.push('Task appears to be completed');
            confidence = 0.9;
        } else if (hasErrors) {
            learnings.push('Some tools encountered errors');
            learnings.push('May need to retry or adjust approach');
            confidence = 0.3;
        } else if (toolExecutions.length === 0) {
            learnings.push('No tools were needed for this response');
            learnings.push('Provided text-only answer');
            confidence = 0.7;
        }

        // Generate insight
        const insight = hasErrors
            ? 'Task partially completed with some errors'
            : hasSuccess
                ? 'Task completed successfully'
                : 'Provided informational response';

        // Suggested actions
        const suggestedActions: string[] = [];
        if (hasErrors) {
            suggestedActions.push('Review error messages and adjust approach');
            suggestedActions.push('Consider alternative tools or methods');
        }

        // Add reflection
        this.stateManager.addReflection(insight, learnings, suggestedActions, confidence);

        if (this.sseWriter) {
            this.sseWriter.writeAgentReflection(insight, learnings, suggestedActions, confidence);
        }

        console.log(`  🎯 Insight: ${insight} (confidence: ${(confidence * 100).toFixed(0)}%)`);
        for (const learning of learnings) {
            console.log(`  📚 ${learning}`);
        }

        // Decide if we should continue
        // For now, we complete after one turn. In the future, we could:
        // - Continue if errors occurred and we think we can fix them
        // - Continue if the task is complex and needs multiple iterations
        // - Continue if user feedback suggests more work needed

        const shouldContinue = hasErrors && confidence < 0.5;

        // Stop the loop
        this.stateManager.stopLoop();

        return {
            shouldContinue,
            nextAction: shouldContinue ? 'Retry failed operations with adjusted approach' : undefined,
        };
    }

    // ========================================================================
    // STATE ACCESS
    // ========================================================================

    getState(): AgentLoopState {
        return this.stateManager.getState();
    }

    getSummary() {
        return this.stateManager.getSummary();
    }

    /**
     * Track a tool execution (called by the agent during streaming)
     */
    trackToolExecution(
        id: string,
        name: string,
        args: Record<string, unknown>,
        dependencies?: string[]
    ) {
        return this.stateManager.trackToolStart(name, args, dependencies);
    }

    /**
     * Update tool execution result
     */
    updateToolExecution(id: string, result?: unknown, error?: string) {
        this.stateManager.trackToolComplete(id, result, error);
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create an agent loop coordinator for a chat session
 */
export function createAgentLoop(options: AgentLoopOptions): AgentLoopCoordinator {
    return new AgentLoopCoordinator(options);
}

/**
 * Get the current state summary for display
 */
export async function getAgentLoopSummary(sessionId: string) {
    const manager = await getAgentLoopState(sessionId);
    return manager.getSummary();
}
