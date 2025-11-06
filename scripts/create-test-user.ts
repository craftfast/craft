import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
    const hashedPassword = await bcrypt.hash('TestP@ssw0rd123', 12);

    const user = await prisma.user.upsert({
        where: { email: 'testuser@craft.test' },
        update: {
            emailVerified: true,
        },
        create: {
            email: 'testuser@craft.test',
            name: 'Test User',
            emailVerified: true,
        }
    });

    console.log('✅ Test user created/updated:', user.email);
    console.log('   Password: TestP@ssw0rd123');
    console.log('   ID:', user.id);

    await prisma.$disconnect();
}

createTestUser().catch(console.error);
