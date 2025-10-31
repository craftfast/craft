import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
    const hashedPassword = await bcrypt.hash('TestP@ssw0rd123', 14);

    const user = await prisma.user.upsert({
        where: { email: 'testuser@craft.test' },
        update: {
            password: hashedPassword,
            emailVerified: new Date(),
            failedLoginAttempts: 0,
            lockedUntil: null
        },
        create: {
            email: 'testuser@craft.test',
            name: 'Test User',
            password: hashedPassword,
            emailVerified: new Date(),
            failedLoginAttempts: 0
        }
    });

    console.log('✅ Test user created/updated:', user.email);
    console.log('   Password: TestP@ssw0rd123');
    console.log('   ID:', user.id);

    await prisma.$disconnect();
}

createTestUser().catch(console.error);
