/**
 * Task Manager for Multi-Agent Orchestration
 * Handles task creation, status updates, dependency tracking, and execution ordering
 */

import { prisma } from "@/lib/db";
import type {
    OrchestratorState,
    TaskInfo,
    TaskResult,
    TaskStatus,
    TaskPhase,
    ProgressReport,
} from "@/types/orchestrator";

export class TaskManager {
    /**
     * Create a new task and add to session
     */
    static async createTask(
        sessionId: string,
        task: Omit<TaskInfo, "id" | "createdAt">
    ): Promise<TaskInfo> {
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const state = session.sessionData as unknown as OrchestratorState;

        // Generate task ID
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Create task info
        const newTask: TaskInfo = {
            id: taskId,
            ...task,
            createdAt: new Date(),
        };

        // Add to state
        state.tasks.push(newTask);
        state.totalSteps += 1;

        // Save to database (both in state and tasks table)
        await prisma.agentSession.update({
            where: { id: sessionId },
            data: { sessionData: state as any },
        });

        await prisma.task.create({
            data: {
                id: taskId,
                sessionId,
                projectId: state.projectId || undefined,
                phase: task.phase,
                description: task.description,
                status: task.status,
                assignedTo: task.assignedTo,
                tier: task.tier || "fast",
                dependsOn: task.dependsOn,
                attempts: task.attempts,
                maxAttempts: task.maxAttempts,
            },
        });

        console.log(`✨ Created task: ${taskId} - ${task.description}`);
        return newTask;
    }

    /**
     * Create multiple tasks at once
     */
    static async createTasks(
        sessionId: string,
        tasks: Array<Omit<TaskInfo, "id" | "createdAt">>
    ): Promise<TaskInfo[]> {
        const createdTasks: TaskInfo[] = [];

        for (const task of tasks) {
            const created = await this.createTask(sessionId, task);
            createdTasks.push(created);
        }

        console.log(`✨ Created ${createdTasks.length} tasks`);
        return createdTasks;
    }

    /**
     * Update task status and result
     */
    static async updateTask(
        sessionId: string,
        taskId: string,
        updates: {
            status?: TaskStatus;
            result?: TaskResult;
            errorMessage?: string;
        }
    ): Promise<void> {
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const state = session.sessionData as unknown as OrchestratorState;

        // Find and update task in state
        const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error(`Task not found: ${taskId}`);
        }

        const task = state.tasks[taskIndex];

        // Update task
        if (updates.status) {
            task.status = updates.status;

            if (updates.status === "in-progress") {
                task.startedAt = new Date();
                state.currentTaskId = taskId;
            } else if (updates.status === "completed") {
                task.completedAt = new Date();
                state.completedTaskIds.push(taskId);
                state.completedSteps += 1;
                state.currentTaskId = undefined;
            } else if (updates.status === "failed") {
                task.completedAt = new Date();
                state.failedTaskIds.push(taskId);
                state.currentTaskId = undefined;
            }
        }

        if (updates.result) {
            task.result = updates.result;
        }

        state.tasks[taskIndex] = task;

        // Save to database
        await prisma.agentSession.update({
            where: { id: sessionId },
            data: { sessionData: state as any },
        });

        await prisma.task.update({
            where: { id: taskId },
            data: {
                status: updates.status,
                result: updates.result as any,
                errorMessage: updates.errorMessage,
                startedAt: task.startedAt || undefined,
                completedAt: task.completedAt || undefined,
            },
        });

        console.log(`✅ Updated task ${taskId}: ${updates.status || "updated"}`);
    }

    /**
     * Get next pending task (respecting dependencies)
     */
    static async getNextTask(sessionId: string): Promise<TaskInfo | null> {
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const state = session.sessionData as unknown as OrchestratorState;

        // Find first pending task where all dependencies are completed
        for (const task of state.tasks) {
            if (task.status !== "pending") continue;

            // Check if all dependencies are completed
            const allDependenciesComplete = task.dependsOn.every((depId) =>
                state.completedTaskIds.includes(depId)
            );

            if (allDependenciesComplete) {
                return task;
            }
        }

        return null;
    }

    /**
     * Get task by ID
     */
    static async getTask(
        sessionId: string,
        taskId: string
    ): Promise<TaskInfo | null> {
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const state = session.sessionData as unknown as OrchestratorState;
        return state.tasks.find((t) => t.id === taskId) || null;
    }

    /**
     * Get all tasks for a session
     */
    static async getTasks(sessionId: string): Promise<TaskInfo[]> {
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const state = session.sessionData as unknown as OrchestratorState;
        return state.tasks;
    }

    /**
     * Get tasks by status
     */
    static async getTasksByStatus(
        sessionId: string,
        status: TaskStatus
    ): Promise<TaskInfo[]> {
        const tasks = await this.getTasks(sessionId);
        return tasks.filter((t) => t.status === status);
    }

    /**
     * Get tasks by phase
     */
    static async getTasksByPhase(
        sessionId: string,
        phase: TaskPhase
    ): Promise<TaskInfo[]> {
        const tasks = await this.getTasks(sessionId);
        return tasks.filter((t) => t.phase === phase);
    }

    /**
     * Increment task attempt count
     */
    static async incrementAttempts(
        sessionId: string,
        taskId: string
    ): Promise<void> {
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const state = session.sessionData as unknown as OrchestratorState;
        const taskIndex = state.tasks.findIndex((t) => t.id === taskId);

        if (taskIndex === -1) {
            throw new Error(`Task not found: ${taskId}`);
        }

        state.tasks[taskIndex].attempts += 1;

        await prisma.agentSession.update({
            where: { id: sessionId },
            data: { sessionData: state as any },
        });

        await prisma.task.update({
            where: { id: taskId },
            data: { attempts: state.tasks[taskIndex].attempts },
        });
    }

    /**
     * Check if task can be retried
     */
    static async canRetry(sessionId: string, taskId: string): Promise<boolean> {
        const task = await this.getTask(sessionId, taskId);
        if (!task) return false;
        return task.attempts < task.maxAttempts;
    }

    /**
     * Get progress report
     */
    static async getProgress(sessionId: string): Promise<ProgressReport> {
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const state = session.sessionData as unknown as OrchestratorState;

        const totalTasks = state.tasks.length;
        const completedTasks = state.completedTaskIds.length;
        const failedTasks = state.failedTaskIds.length;
        const inProgressTasks = state.tasks.filter(
            (t) => t.status === "in-progress"
        ).length;
        const pendingTasks = state.tasks.filter(
            (t) => t.status === "pending"
        ).length;

        const currentTask = state.currentTaskId
            ? state.tasks.find((t) => t.id === state.currentTaskId)
            : undefined;

        const percentComplete =
            totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
            sessionId,
            totalTasks,
            completedTasks,
            failedTasks,
            pendingTasks,
            inProgressTasks,
            currentTask,
            percentComplete: Math.round(percentComplete),
        };
    }

    /**
     * Check if all tasks are complete
     */
    static async areAllTasksComplete(sessionId: string): Promise<boolean> {
        const tasks = await this.getTasks(sessionId);
        return tasks.every(
            (t) => t.status === "completed" || t.status === "failed"
        );
    }

    /**
     * Get failed tasks
     */
    static async getFailedTasks(sessionId: string): Promise<TaskInfo[]> {
        return this.getTasksByStatus(sessionId, "failed");
    }

    /**
     * Reset task to pending (for retry)
     */
    static async resetTask(sessionId: string, taskId: string): Promise<void> {
        await this.updateTask(sessionId, taskId, { status: "pending" });

        // Remove from completed/failed lists
        const session = await prisma.agentSession.findUnique({
            where: { id: sessionId },
        });

        if (session) {
            const state = session.sessionData as unknown as OrchestratorState;
            state.completedTaskIds = state.completedTaskIds.filter(
                (id) => id !== taskId
            );
            state.failedTaskIds = state.failedTaskIds.filter((id) => id !== taskId);

            await prisma.agentSession.update({
                where: { id: sessionId },
                data: { sessionData: state as any },
            });
        }
    }
}
