/**
 * Neon Database Consumption Tracking
 * Fetches usage metrics from Neon API and updates billing records
 */

import { prisma } from "@/lib/db";
import { getNeonAPI, storageBytesHourToGbMonth } from "@/lib/neon-api";

/**
 * Sync consumption metrics from Neon for all active databases
 * Call this periodically (e.g., daily cron job)
 */
export async function syncNeonConsumption() {
    try {
        console.log("🔄 Syncing Neon consumption metrics...");

        const neonApi = getNeonAPI();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all active Neon databases
        const databases = await prisma.neonDatabase.findMany({
            where: {
                status: {
                    in: ["active", "claimed"],
                },
            },
            include: {
                project: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        console.log(`📊 Found ${databases.length} active databases`);

        const neonProjectIds = databases.map((db) => db.neonProjectId);

        // Fetch consumption metrics from Neon
        const metrics = await neonApi.getConsumptionMetrics(
            startOfMonth.toISOString(),
            now.toISOString(),
            "daily",
            neonProjectIds
        );

        console.log(
            `📈 Total storage: ${storageBytesHourToGbMonth(metrics.total_usage.data_storage_bytes_hour).toFixed(2)} GB`
        );

        // Update usage records for each project
        for (const db of databases) {
            const projectMetrics = metrics.projects?.find(
                (p) => p.project_id === db.neonProjectId
            );

            if (!projectMetrics) {
                console.log(`⚠️ No metrics found for ${db.neonProjectId}`);
                continue;
            }

            const storageGb = storageBytesHourToGbMonth(
                projectMetrics.data_storage_bytes_hour
            );

            // Find or create usage record for current billing period
            // TODO: Implement this based on your billing model
            console.log(
                `✅ Project ${db.projectId}: ${storageGb.toFixed(2)} GB storage`
            );

            // You can update the UsageRecord model here
            // Example:
            // await prisma.usageRecord.upsert({
            //   where: { /* unique key */ },
            //   update: { databaseSizeGb: storageGb },
            //   create: { /* new record */ }
            // });
        }

        console.log("✅ Neon consumption sync complete");
    } catch (error) {
        console.error("❌ Error syncing Neon consumption:", error);
        throw error;
    }
}

/**
 * Get current month consumption for a specific project
 */
export async function getProjectNeonConsumption(neonProjectId: string) {
    try {
        const neonApi = getNeonAPI();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const metrics = await neonApi.getConsumptionMetrics(
            startOfMonth.toISOString(),
            now.toISOString(),
            "daily",
            [neonProjectId]
        );

        const projectMetrics = metrics.projects?.[0];

        if (!projectMetrics) {
            return null;
        }

        return {
            projectId: neonProjectId,
            storageGb: storageBytesHourToGbMonth(
                projectMetrics.data_storage_bytes_hour
            ),
            computeTimeSeconds: projectMetrics.compute_time_seconds,
            activeTimeSeconds: projectMetrics.active_time_seconds,
            writtenDataBytes: projectMetrics.written_data_bytes,
            dataTransferBytes: projectMetrics.data_transfer_bytes,
        };
    } catch (error) {
        console.error(`Error fetching consumption for ${neonProjectId}:`, error);
        return null;
    }
}
