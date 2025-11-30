/**
 * Make User Admin Script
 * 
 * Usage:
 * npx tsx scripts/make-admin.ts <email>
 * 
 * Example:
 * npx tsx scripts/make-admin.ts admin@example.com
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";

async function makeAdmin(email: string) {
    try {
        console.log(`🔍 Looking for user: ${email}`);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, role: true },
        });

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        // Check if already admin
        if (user.role === "admin") {
            console.log(`ℹ️  User ${email} is already an admin`);
            process.exit(0);
        }

        // Update to admin
        await prisma.user.update({
            where: { email },
            data: { role: "admin" },
        });

        console.log(`✅ Successfully promoted ${email} to admin`);
        console.log(`👤 User: ${user.name || "No name"}`);
        console.log(`🆔 ID: ${user.id}`);
    } catch (error) {
        console.error(`❌ Error:`, error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function removeAdmin(email: string) {
    try {
        console.log(`🔍 Looking for user: ${email}`);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, role: true },
        });

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        // Check if not admin
        if (user.role !== "admin") {
            console.log(`ℹ️  User ${email} is not an admin`);
            process.exit(0);
        }

        // Update to user
        await prisma.user.update({
            where: { email },
            data: { role: "user" },
        });

        console.log(`✅ Successfully removed admin role from ${email}`);
        console.log(`👤 User: ${user.name || "No name"}`);
        console.log(`🆔 ID: ${user.id}`);
    } catch (error) {
        console.error(`❌ Error:`, error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function listAdmins() {
    try {
        console.log(`🔍 Fetching all admin users...`);

        const admins = await prisma.user.findMany({
            where: { role: "admin" },
            select: { id: true, email: true, name: true, createdAt: true },
        });

        if (admins.length === 0) {
            console.log(`ℹ️  No admin users found`);
            process.exit(0);
        }

        console.log(`\n👑 Admin Users (${admins.length}):\n`);
        admins.forEach((admin, index) => {
            console.log(`${index + 1}. ${admin.email}`);
            console.log(`   Name: ${admin.name || "No name"}`);
            console.log(`   ID: ${admin.id}`);
            console.log(`   Created: ${admin.createdAt.toISOString()}`);
            console.log("");
        });
    } catch (error) {
        console.error(`❌ Error:`, error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];
const email = args[1];

if (!command) {
    console.log(`
Usage:
  npx tsx scripts/make-admin.ts add <email>       - Promote user to admin
  npx tsx scripts/make-admin.ts remove <email>    - Remove admin role
  npx tsx scripts/make-admin.ts list              - List all admins

Examples:
  npx tsx scripts/make-admin.ts add admin@example.com
  npx tsx scripts/make-admin.ts remove admin@example.com
  npx tsx scripts/make-admin.ts list
    `);
    process.exit(1);
}

switch (command) {
    case "add":
        if (!email) {
            console.error(`❌ Email required`);
            console.log(`Usage: npx tsx scripts/make-admin.ts add <email>`);
            process.exit(1);
        }
        makeAdmin(email);
        break;

    case "remove":
        if (!email) {
            console.error(`❌ Email required`);
            console.log(`Usage: npx tsx scripts/make-admin.ts remove <email>`);
            process.exit(1);
        }
        removeAdmin(email);
        break;

    case "list":
        listAdmins();
        break;

    default:
        console.error(`❌ Unknown command: ${command}`);
        console.log(`Valid commands: add, remove, list`);
        process.exit(1);
}
