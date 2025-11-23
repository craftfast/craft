import 'dotenv/config';
import { prisma } from '../src/lib/db';
import fs from 'fs';

async function runMigration() {
    try {
        const sql = fs.readFileSync('prisma/migrations/20241123155500_remove_referral_system/migration.sql', 'utf-8');

        // Split by semicolons and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.toLowerCase().includes('do $$')) {
                // Handle the DO block specially
                const doBlockMatch = sql.match(/DO \$\$[\s\S]*?END \$\$;/i);
                if (doBlockMatch) {
                    await prisma.$executeRawUnsafe(doBlockMatch[0]);
                }
                break; // Skip the rest as we've handled the DO block
            } else if (statement.trim()) {
                await prisma.$executeRawUnsafe(statement);
            }
        }

        console.log('✅ Migration executed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

runMigration();
