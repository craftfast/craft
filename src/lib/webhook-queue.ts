/**
 * Webhook Queue
 * 
 * BullMQ-based queue system for processing webhook events with retry logic
 * Ensures webhook reliability with exponential backoff
 * 
 * NOTE: This uses ioredis which requires a TCP Redis connection.
 * Upstash REST URLs won't work - you need either:
 * - A real Redis server
 * - Upstash Redis with TCP connection string (redis://...)
 * 
 * If REDIS_URL is not configured, webhook queue is disabled.
 */

import { Queue, Job } from "bullmq";
import { Redis } from "ioredis";

// Lazy initialization to prevent connection during build
let _connection: Redis | null = null;
let _webhookQueue: Queue<WebhookJobData> | null = null;
let _initialized = false;

// Redis connection - requires TCP Redis (not REST API)
const getRedisConnection = (): Redis | null => {
    // Skip during build
    if (process.env.NEXT_PHASE === "phase-production-build") {
        return null;
    }

    // Require explicit REDIS_URL for BullMQ (TCP connection)
    // Upstash REST URL won't work with ioredis/BullMQ
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        console.warn("⚠️ REDIS_URL not configured - webhook queue disabled");
        console.warn("   BullMQ requires a TCP Redis connection (redis://...)");
        console.warn("   Upstash REST URLs (https://...) won't work with BullMQ");
        return null;
    }

    try {
        return new Redis(redisUrl, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true, // Don't connect immediately
        });
    } catch (error) {
        console.error("Failed to create Redis connection:", error);
        return null;
    }
};

// Initialize queue lazily
const initializeQueue = () => {
    if (_initialized) return;
    _initialized = true;

    _connection = getRedisConnection();

    if (_connection) {
        _webhookQueue = new Queue<WebhookJobData>("webhook-processing", {
            connection: _connection,
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: "exponential",
                    delay: 60000,
                },
                removeOnComplete: {
                    count: 1000,
                    age: 7 * 24 * 60 * 60,
                },
                removeOnFail: {
                    count: 5000,
                },
            },
        });
    }
};

// Get queue (initializes lazily)
const getQueue = (): Queue<WebhookJobData> | null => {
    initializeQueue();
    return _webhookQueue;
};

// Webhook job data interface
export interface WebhookJobData {
    eventId: string;
    eventType: string;
    payload: Record<string, unknown>;
    attempt: number;
}

// Legacy export for backward compatibility (now lazy)
export const webhookQueue = {
    get queue() {
        return getQueue();
    },
    async add(...args: Parameters<Queue<WebhookJobData>["add"]>) {
        const q = getQueue();
        if (!q) throw new Error("Webhook queue not available - REDIS_URL not configured");
        return q.add(...args);
    },
    async getJob(jobId: string) {
        const q = getQueue();
        if (!q) return null;
        return q.getJob(jobId);
    },
    async getWaitingCount() {
        const q = getQueue();
        return q?.getWaitingCount() ?? 0;
    },
    async getActiveCount() {
        const q = getQueue();
        return q?.getActiveCount() ?? 0;
    },
    async getCompletedCount() {
        const q = getQueue();
        return q?.getCompletedCount() ?? 0;
    },
    async getFailedCount() {
        const q = getQueue();
        return q?.getFailedCount() ?? 0;
    },
    async getDelayedCount() {
        const q = getQueue();
        return q?.getDelayedCount() ?? 0;
    },
    async getFailed(start: number, end: number) {
        const q = getQueue();
        return q?.getFailed(start, end) ?? [];
    },
    async getCompleted(start: number, end: number) {
        const q = getQueue();
        return q?.getCompleted(start, end) ?? [];
    },
    async clean(grace: number, limit: number, type: "completed" | "failed") {
        const q = getQueue();
        return q?.clean(grace, limit, type) ?? [];
    },
    async close() {
        const q = getQueue();
        await q?.close();
    },
};

/**
 * Add a webhook event to the processing queue
 */
export async function enqueueWebhookEvent(
    eventId: string,
    eventType: string,
    payload: Record<string, unknown>
): Promise<Job<WebhookJobData>> {
    return await webhookQueue.add(
        `webhook-${eventType}`,
        {
            eventId,
            eventType,
            payload,
            attempt: 0,
        },
        {
            jobId: eventId, // Use event ID to prevent duplicates
        }
    );
}

/**
 * Retry a failed webhook event
 */
export async function retryWebhookEvent(eventId: string): Promise<boolean> {
    const job = await webhookQueue.getJob(eventId);

    if (!job) {
        console.error(`Job ${eventId} not found`);
        return false;
    }

    if (await job.isCompleted()) {
        console.log(`Job ${eventId} is already completed`);
        return false;
    }

    // Retry the job
    await job.retry();
    console.log(`Job ${eventId} queued for retry`);
    return true;
}

/**
 * Get webhook queue statistics
 */
export async function getWebhookQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        webhookQueue.getWaitingCount(),
        webhookQueue.getActiveCount(),
        webhookQueue.getCompletedCount(),
        webhookQueue.getFailedCount(),
        webhookQueue.getDelayedCount(),
    ]);

    return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
    };
}

/**
 * Get recent failed webhook jobs
 */
export async function getFailedWebhookJobs(limit = 50) {
    const failedJobs = await webhookQueue.getFailed(0, limit - 1);

    return failedJobs.map(job => ({
        id: job.id,
        eventId: job.data.eventId,
        eventType: job.data.eventType,
        attempt: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        error: job.failedReason,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
    }));
}

/**
 * Get recent completed webhook jobs
 */
export async function getCompletedWebhookJobs(limit = 50) {
    const completedJobs = await webhookQueue.getCompleted(0, limit - 1);

    return completedJobs.map(job => ({
        id: job.id,
        eventId: job.data.eventId,
        eventType: job.data.eventType,
        attempt: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
    }));
}

/**
 * Clean up old jobs
 */
export async function cleanupWebhookQueue(
    gracePeriodMs = 7 * 24 * 60 * 60 * 1000 // 7 days
): Promise<{ removed: number }> {
    const removed = await webhookQueue.clean(gracePeriodMs, 1000, "completed");
    console.log(`Cleaned up ${removed.length} old webhook jobs`);

    return { removed: removed.length };
}

/**
 * Close queue connections
 */
export async function closeWebhookQueue() {
    await webhookQueue.close();
    if (_connection) {
        await _connection.quit();
    }
}
