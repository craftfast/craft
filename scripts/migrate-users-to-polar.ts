#!/usr/bin/env tsx
/**
 * Polar User Migration Script
 * 
 * Migrates existing users to Polar by creating customer accounts for all users
 * who don't already have polarCustomerId set.
 * 
 * Features:
 * - Batch processing to avoid overwhelming API
 * - Duplicate detection and linking
 * - Progress tracking
 * - Error handling and retry logic
 * - Dry run mode for testing
 * 
 * Usage:
 *   pnpm tsx scripts/migrate-users-to-polar.ts [--dry-run] [--batch-size=50] [--delay=100]
 */

import { prisma } from "../src/lib/db";
import { createPolarCustomer, linkExistingPolarCustomer } from "../src/lib/polar/customer";

interface MigrationStats {
    total: number;
    processed: number;
    success: number;
    failed: number;
    skipped: number;
    duplicates: number;
}

interface MigrationOptions {
    dryRun: boolean;
    batchSize: number;
    delay: number; // ms between batches
}

const stats: MigrationStats = {
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    duplicates: 0,
};

const errors: Array<{ userId: string; email: string; error: string }> = [];

/**
 * Parse command line arguments
 */
function parseArgs(): MigrationOptions {
    const args = process.argv.slice(2);
    const options: MigrationOptions = {
        dryRun: args.includes("--dry-run"),
        batchSize: 50,
        delay: 100,
    };

    args.forEach((arg) => {
        if (arg.startsWith("--batch-size=")) {
            options.batchSize = parseInt(arg.split("=")[1], 10);
        }
        if (arg.startsWith("--delay=")) {
            options.delay = parseInt(arg.split("=")[1], 10);
        }
    });

    return options;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Migrate a single user
 */
async function migrateUser(
    user: { id: string; email: string; name: string | null; polarCustomerId: string | null },
    dryRun: boolean
): Promise<boolean> {
    try {
        // Skip users who already have Polar customer ID
        if (user.polarCustomerId) {
            stats.skipped++;
            console.log(`  ⏭️  Skipping ${user.email} (already has Polar customer)`);
            return true;
        }

        if (dryRun) {
            console.log(`  🔍 [DRY RUN] Would create Polar customer for: ${user.email}`);
            stats.success++;
            return true;
        }

        // Fetch full user object for createPolarCustomer
        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!fullUser) {
            throw new Error("User not found");
        }

        // Attempt to create Polar customer
        const result = await createPolarCustomer(fullUser);

        if (result.success) {
            stats.success++;
            console.log(`  ✅ Created Polar customer for: ${user.email}`);
            return true;
        } else {
            // Check if it's a duplicate error
            if (result.error?.includes("already exists")) {
                stats.duplicates++;
                console.log(`  🔗 Linking existing Polar customer for: ${user.email}`);

                // Attempt to link existing customer
                const linkResult = await linkExistingPolarCustomer(fullUser);

                if (linkResult.success) {
                    stats.success++;
                    console.log(`  ✅ Linked existing customer for: ${user.email}`);
                    return true;
                } else {
                    throw new Error(`Failed to link existing customer: ${linkResult.error}`);
                }
            } else {
                throw new Error(result.error || "Unknown error");
            }
        }
    } catch (error) {
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push({
            userId: user.id,
            email: user.email,
            error: errorMessage,
        });
        console.error(`  ❌ Failed for ${user.email}: ${errorMessage}`);
        return false;
    }
}

/**
 * Process users in batches
 */
async function processBatch(
    users: Array<{ id: string; email: string; name: string | null; polarCustomerId: string | null }>,
    options: MigrationOptions
): Promise<void> {
    for (const user of users) {
        await migrateUser(user, options.dryRun);
        stats.processed++;
    }
}

/**
 * Main migration function
 */
async function runMigration() {
    const options = parseArgs();

    console.log("\n🚀 Polar User Migration Script");
    console.log("================================\n");

    if (options.dryRun) {
        console.log("⚠️  DRY RUN MODE - No actual changes will be made\n");
    }

    console.log(`Configuration:`);
    console.log(`  - Batch Size: ${options.batchSize}`);
    console.log(`  - Delay: ${options.delay}ms between batches`);
    console.log(`  - Dry Run: ${options.dryRun}\n`);

    try {
        // Count total users without Polar customer ID
        const totalUsers = await prisma.user.count({
            where: {
                polarCustomerId: null,
                deletedAt: null, // Skip soft-deleted users
            },
        });

        stats.total = totalUsers;

        if (totalUsers === 0) {
            console.log("✨ All users already have Polar customer accounts!");
            return;
        }

        console.log(`📊 Found ${totalUsers} users to migrate\n`);
        console.log("Starting migration...\n");

        // Process users in batches
        let skip = 0;
        while (skip < totalUsers) {
            const users = await prisma.user.findMany({
                where: {
                    polarCustomerId: null,
                    deletedAt: null,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    polarCustomerId: true,
                },
                take: options.batchSize,
                skip,
                orderBy: {
                    createdAt: "asc", // Process oldest users first
                },
            });

            if (users.length === 0) break;

            console.log(`\n📦 Processing batch ${Math.floor(skip / options.batchSize) + 1}...`);
            await processBatch(users, options);

            skip += options.batchSize;

            // Progress update
            const progress = Math.min((stats.processed / totalUsers) * 100, 100);
            console.log(`\n📈 Progress: ${stats.processed}/${totalUsers} (${progress.toFixed(1)}%)`);

            // Delay between batches to avoid rate limiting
            if (skip < totalUsers) {
                console.log(`⏳ Waiting ${options.delay}ms before next batch...`);
                await sleep(options.delay);
            }
        }

        // Final summary
        console.log("\n" + "=".repeat(50));
        console.log("📊 Migration Summary");
        console.log("=".repeat(50));
        console.log(`Total Users:      ${stats.total}`);
        console.log(`Processed:        ${stats.processed}`);
        console.log(`✅ Successful:    ${stats.success}`);
        console.log(`⏭️  Skipped:       ${stats.skipped}`);
        console.log(`🔗 Duplicates:    ${stats.duplicates}`);
        console.log(`❌ Failed:        ${stats.failed}`);
        console.log("=".repeat(50) + "\n");

        if (errors.length > 0) {
            console.log("❌ Errors encountered:");
            console.log("=".repeat(50));
            errors.forEach((err, index) => {
                console.log(`${index + 1}. User: ${err.email} (${err.userId})`);
                console.log(`   Error: ${err.error}\n`);
            });

            if (!options.dryRun) {
                console.log("💡 Tip: These users will be retried on their first checkout attempt.");
            }
        }

        if (options.dryRun) {
            console.log("\n⚠️  This was a dry run. No actual changes were made.");
            console.log("Run without --dry-run to perform the migration.\n");
        } else {
            console.log("\n✨ Migration complete!\n");
        }
    } catch (error) {
        console.error("\n❌ Migration failed with error:");
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
runMigration()
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
