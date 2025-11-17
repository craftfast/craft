/**
 * Script to clean up base64 profile images from the database
 * Run with: npx tsx scripts/clean-base64-images.ts
 */

import { prisma } from "../src/lib/db";

async function cleanBase64Images() {
    console.log("🔍 Checking for base64 profile images...\n");

    // Find all users with base64 images
    const usersWithBase64 = await prisma.user.findMany({
        where: {
            image: {
                startsWith: "data:image/",
            },
        },
        select: {
            id: true,
            email: true,
            image: true,
        },
    });

    if (usersWithBase64.length === 0) {
        console.log("✅ No base64 images found in database!");
        return;
    }

    console.log(`Found ${usersWithBase64.length} users with base64 images:\n`);

    usersWithBase64.forEach((user, index) => {
        const imageSize = user.image ? Buffer.from(user.image.split(",")[1] || "", "base64").length : 0;
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Image size: ${(imageSize / 1024).toFixed(2)} KB`);
        console.log(`   Preview: ${user.image?.substring(0, 50)}...`);
        console.log("");
    });

    const totalSize = usersWithBase64.reduce((sum, user) => {
        const imageSize = user.image ? Buffer.from(user.image.split(",")[1] || "", "base64").length : 0;
        return sum + imageSize;
    }, 0);

    console.log(`💾 Total base64 image data: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);

    // Ask for confirmation
    console.log("⚠️  This will set all base64 images to NULL.");
    console.log("   Users will see their default avatar until they upload a new profile picture.\n");

    // In a real scenario, you'd prompt for confirmation here
    // For now, we'll just proceed

    console.log("🧹 Cleaning up base64 images...\n");

    const result = await prisma.user.updateMany({
        where: {
            image: {
                startsWith: "data:image/",
            },
        },
        data: {
            image: null,
        },
    });

    console.log(`✅ Successfully cleaned ${result.count} profile images!`);
    console.log(`💾 Database storage saved: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);
}

cleanBase64Images()
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
