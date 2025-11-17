const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetDatabase() {
    try {
        console.log('Dropping all tables...');

        // Drop all tables using CASCADE
        await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE;');
        console.log('Schema dropped.');

        await prisma.$executeRawUnsafe('CREATE SCHEMA public;');
        console.log('Schema recreated.');

        console.log('Database reset complete! Now run: npx prisma db push');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

resetDatabase();
