const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function releaseLocks() {
    try {
        console.log('Attempting to release advisory locks...');
        const result = await prisma.$queryRawUnsafe('SELECT pg_advisory_unlock_all();');
        console.log('Locks released successfully:', result);

        // Also check for active locks
        const activeLocks = await prisma.$queryRawUnsafe(`
      SELECT locktype, database, relation, page, tuple, virtualxid, transactionid, classid, objid, objsubid, virtualtransaction, pid, mode, granted 
      FROM pg_locks 
      WHERE locktype = 'advisory';
    `);
        console.log('Active advisory locks:', activeLocks);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

releaseLocks();
