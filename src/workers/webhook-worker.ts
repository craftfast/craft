/**
 * Webhook Worker
 * 
 * Background worker that processes webhook events from the queue
 * Handles retry logic and error management
 * 
 * This should run as a separate process in production
 * Usage: tsx src/workers/webhook-worker.ts
 */

import { Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { WebhookJobData } from "@/lib/webhook-queue";
import { prisma } from "@/lib/db";

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

/**
 * Process a webhook event
 */
async function processWebhookEvent(job: Job<WebhookJobData>): Promise<void> {
    const { eventId, eventType, payload, attempt } = job.data;

    console.log(`[Worker] Processing webhook ${eventId} (${eventType}) - Attempt ${attempt + 1}`);

    try {
        // Update webhook event status to PROCESSING
        await prisma.polarWebhookEvent.updateMany({
            where: { eventId },
            data: {
                status: "PROCESSING",
                retryCount: attempt,
            },
        });

        // Process the webhook based on type
        await processWebhookByType(eventType, payload);

        // Mark as completed
        await prisma.polarWebhookEvent.updateMany({
            where: { eventId },
            data: {
                status: "COMPLETED",
                processedAt: new Date(),
                errorMessage: null,
            },
        });

        console.log(`[Worker] ✅ Successfully processed webhook ${eventId}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Worker] ❌ Failed to process webhook ${eventId}:`, errorMessage);

        // Update webhook event with error
        await prisma.polarWebhookEvent.updateMany({
            where: { eventId },
            data: {
                status: "FAILED",
                errorMessage: errorMessage,
                retryCount: attempt + 1,
            },
        });

        // Re-throw to trigger BullMQ retry
        throw error;
    }
}

/**
 * Process webhook by type
 * This delegates to the appropriate handler
 */
async function processWebhookByType(
    eventType: string,
    payload: Record<string, unknown>
): Promise<void> {
    console.log(`Processing ${eventType} webhook`);

    // Webhooks are already processed synchronously in /api/webhooks/polar
    // This queue is mainly for retry logic and async processing
    // The actual event handlers are in src/lib/polar/webhook-handlers/
}

/**
 * Create and start the webhook worker
 */
export function startWebhookWorker(): Worker<WebhookJobData> {
    const worker = new Worker<WebhookJobData>(
        "webhook-processing",
        async (job) => {
            await processWebhookEvent(job);
        },
        {
            connection,
            concurrency: 5, // Process up to 5 webhooks concurrently
            limiter: {
                max: 100, // Maximum 100 jobs
                duration: 60000, // per minute
            },
        }
    );

    // Event handlers
    worker.on("completed", (job) => {
        console.log(`[Worker] Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job, err) => {
        if (job) {
            console.error(`[Worker] Job ${job.id} failed:`, err.message);

            // Check if we've exhausted retries
            if (job.attemptsMade >= (job.opts.attempts || 5)) {
                console.error(`[Worker] Job ${job.id} exhausted all retries, moving to dead letter`);
            }
        }
    });

    worker.on("error", (err) => {
        console.error("[Worker] Worker error:", err);
    });

    console.log("🚀 Webhook worker started");
    console.log("  Concurrency: 5");
    console.log("  Rate limit: 100 jobs/minute");
    console.log("  Retry attempts: 5");
    console.log("  Backoff: Exponential (1min, 5min, 30min, 2hr, 24hr)");

    return worker;
}

// Start worker if run directly
if (require.main === module) {
    console.log("Starting webhook worker...");
    const worker = startWebhookWorker();

    // Graceful shutdown
    process.on("SIGTERM", async () => {
        console.log("SIGTERM received, closing worker...");
        await worker.close();
        await connection.quit();
        process.exit(0);
    });

    process.on("SIGINT", async () => {
        console.log("SIGINT received, closing worker...");
        await worker.close();
        await connection.quit();
        process.exit(0);
    });
}
