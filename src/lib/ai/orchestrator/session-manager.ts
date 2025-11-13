/**
 * Session Manager for Multi-Agent Orchestration
 * Handles session creation, state persistence, and retrieval
 */

import { prisma } from "@/lib/db";
import type {
    OrchestratorState,
    ConversationMessage,
    SessionConfig,
} from "@/types/orchestrator";

export class SessionManager {
    /**
     * Load existing session or create a new one
     */
    static async loadOrCreate(
        userId: string,
        projectId?: string,
        config?: SessionConfig
    ): Promise<OrchestratorState> {
        // Try to find an active session
        const existingSession = await prisma.agentSession.findFirst({
            where: {
                userId,
                projectId: projectId || null,
                status: "active",
                expiresAt: { gt: new Date() },
            },
            orderBy: { lastActive: "desc" },
        });

        if (existingSession) {
            console.log(`📂 Resuming session: ${existingSession.id}`);
            const state = existingSession.sessionData as unknown as OrchestratorState;

            // Update lastActive timestamp
            state.lastActive = new Date();

            return state;
        }

        // Create new session
        const sessionId = `sess_${userId}_${Date.now()}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const newState: OrchestratorState = {
            sessionId,
            userId,
            projectId,
            conversationHistory: [],
            tasks: [],
            completedTaskIds: [],
            failedTaskIds: [],
            requirements: [],
            totalSteps: 0,
            completedSteps: 0,
            createdAt: new Date(),
            lastActive: new Date(),
        };

        await prisma.agentSession.create({
            data: {
                id: sessionId,
                userId,
                projectId: projectId || null,
                sessionData: newState as any,
                status: "active",
                expiresAt,
            },
        });

        console.log(`✨ Created new session: ${sessionId}`);
        return newState;
    }

    /**
     * Save session state to database
     */
    static async save(state: OrchestratorState): Promise<void> {
        const lastMessage =
            state.conversationHistory.length > 0
                ? state.conversationHistory[state.conversationHistory.length - 1]
                    ?.content
                : null;

        await prisma.agentSession.update({
            where: { id: state.sessionId },
            data: {
                sessionData: state as any,
                messageCount: state.conversationHistory.length,
                lastMessage,
                lastActive: new Date(),
            },
        });
    }

    /**
     * Add message to conversation history
     */
    static async addMessage(
        sessionId: string,
        role: "user" | "assistant" | "system",
        content: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const state = session.sessionData as unknown as OrchestratorState;

        const message: ConversationMessage = {
            role,
            content,
            timestamp: new Date(),
            metadata,
        };

        state.conversationHistory.push(message);
        state.lastActive = new Date();

        await this.save(state);
    }

    /**
     * Get conversation history
     */
    static async getConversationHistory(
        sessionId: string
    ): Promise<ConversationMessage[]> {
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const state = session.sessionData as unknown as OrchestratorState;
        return state.conversationHistory;
    }

    /**
     * Update session status
     */
    static async updateStatus(
        sessionId: string,
        status: "active" | "paused" | "completed" | "expired"
    ): Promise<void> {
        await prisma.agentSession.update({
            where: { id: sessionId },
            data: { status },
        });
    }

    /**
     * Mark session as completed
     */
    static async complete(sessionId: string): Promise<void> {
        await this.updateStatus(sessionId, "completed");
    }

    /**
     * Mark session as paused
     */
    static async pause(sessionId: string): Promise<void> {
        await this.updateStatus(sessionId, "paused");
    }

    /**
     * Resume a paused session
     */
    static async resume(sessionId: string): Promise<OrchestratorState> {
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        await prisma.agentSession.update({
            where: { id: sessionId },
            data: {
                status: "active",
                lastActive: new Date(),
            },
        });

        const state = session.sessionData as unknown as OrchestratorState;
        state.lastActive = new Date();

        console.log(`▶️ Resumed session: ${sessionId}`);
        return state;
    }

    /**
     * Get session by ID
     */
    static async get(sessionId: string): Promise<OrchestratorState | null> {
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return null;
        }

        return session.sessionData as unknown as OrchestratorState;
    }

    /**
     * Delete expired sessions (cleanup)
     */
    static async cleanupExpired(): Promise<number> {
        const result = await prisma.agentSession.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
                status: { in: ["completed", "expired"] },
            },
        });

        if (result.count > 0) {
            console.log(`🗑️ Cleaned up ${result.count} expired sessions`);
        }

        return result.count;
    }

    /**
     * Get all active sessions for a user
     */
    static async getUserSessions(userId: string): Promise<OrchestratorState[]> {
        const sessions = await prisma.agentSession.findMany({
            where: {
                userId,
                status: "active",
                expiresAt: { gt: new Date() },
            },
            orderBy: { lastActive: "desc" },
        });

        return sessions.map((s) => s.sessionData as unknown as OrchestratorState);
    }

    /**
     * Get session stats
     */
    static async getStats(sessionId: string) {
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
            include: {
                tasks: true,
            },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const state = session.sessionData as unknown as OrchestratorState;

        return {
            sessionId,
            status: session.status,
            messageCount: state.conversationHistory.length,
            totalTasks: state.tasks.length,
            completedTasks: state.completedTaskIds.length,
            failedTasks: state.failedTaskIds.length,
            pendingTasks:
                state.tasks.length -
                state.completedTaskIds.length -
                state.failedTaskIds.length,
            createdAt: state.createdAt,
            lastActive: state.lastActive,
            expiresAt: session.expiresAt,
        };
    }
}
