/**
 * Webhook Queue
 * 
 * BullMQ-based queue system for processing webhook events with retry logic
 * Ensures webhook reliability with exponential backoff
 */

import { Queue, Worker, Job } from "bullmq";
import { Redis } from "ioredis";

// Redis connection - uses Upstash by default
const getRedisConnection = () => {
    // If using Upstash Redis (default)
    if (process.env.UPSTASH_REDIS_REST_URL) {
        const url = new URL(process.env.UPSTASH_REDIS_REST_URL);
        return new Redis({
            host: url.hostname,
            port: Number(url.port) || 6379,
            password: process.env.UPSTASH_REDIS_REST_TOKEN,
            tls: url.protocol === "https:" ? {} : undefined,
            maxRetriesPerRequest: null,
        });
    }

    // Fallback to custom Redis configuration
    return new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
    });
};

const connection = getRedisConnection();

// Webhook job data interface
export interface WebhookJobData {
    eventId: string;
    eventType: string;
    payload: Record<string, unknown>;
    attempt: number;
}

// Create webhook queue with retry configuration
export const webhookQueue = new Queue<WebhookJobData>("webhook-processing", {
    connection,
    defaultJobOptions: {
        attempts: 5, // Retry up to 5 times
        backoff: {
            type: "exponential",
            delay: 60000, // Start with 1 minute
        },
        removeOnComplete: {
            count: 1000, // Keep last 1000 completed jobs
            age: 7 * 24 * 60 * 60, // Remove after 7 days
        },
        removeOnFail: {
            count: 5000, // Keep last 5000 failed jobs for debugging
        },
    },
});

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
    await connection.quit();
}
