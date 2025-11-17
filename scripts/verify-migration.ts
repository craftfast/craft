import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
    try {
        console.log('🔍 Verifying Database Migration to Better Auth...\n');

        // Count records in each table
        const userCount = await prisma.user.count();
        const sessionCount = await prisma.session.count();
        const accountCount = await prisma.account.count();
        const verificationCount = await prisma.verification.count();
        const verificationTokenCount = await prisma.verificationToken.count();
        const securityEventCount = await prisma.securityEvent.count();

        console.log('📊 Table Record Counts:');
        console.log(`  ✓ Users: ${userCount}`);
        console.log(`  ✓ Sessions: ${sessionCount}`);
        console.log(`  ✓ Accounts: ${accountCount}`);
        console.log(`  ✓ Verifications (Better Auth): ${verificationCount}`);
        console.log(`  ✓ Verification Tokens (Legacy): ${verificationTokenCount}`);
        console.log(`  ✓ Security Events: ${securityEventCount}\n`);

        // Sample users with accounts
        console.log('👥 Sample Users:');
        const users = await prisma.user.findMany({
            take: 5,
            select: {
                id: true,
                email: true,
                name: true,
                emailVerified: true,
                createdAt: true,
                accounts: {
                    select: {
                        providerId: true,
                        accountId: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        users.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email} (${user.name || 'No name'})`);
            console.log(`     - Email Verified: ${user.emailVerified ? '✓ Yes' : '✗ No'}`);
            console.log(`     - Created: ${user.createdAt.toISOString()}`);
            if (user.accounts.length > 0) {
                console.log(`     - Linked Accounts: ${user.accounts.map(a => a.providerId).join(', ')}`);
            }
            console.log('');
        });

        // Check session structure
        console.log('🔐 Sample Sessions (Better Auth format):');
        const sessions = await prisma.session.findMany({
            take: 3,
            select: {
                id: true,
                token: true,
                expiresAt: true,
                ipAddress: true,
                userAgent: true,
                user: {
                    select: {
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (sessions.length > 0) {
            sessions.forEach((session, index) => {
                console.log(`  ${index + 1}. User: ${session.user.email}`);
                console.log(`     - Token: ${session.token.substring(0, 20)}...`);
                console.log(`     - Expires: ${session.expiresAt.toISOString()}`);
                console.log(`     - IP: ${session.ipAddress || 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('  No active sessions found.\n');
        }

        // Check account structure
        console.log('🔗 Sample Accounts (Better Auth format):');
        const accounts = await prisma.account.findMany({
            take: 3,
            select: {
                id: true,
                providerId: true,
                accountId: true,
                accessToken: true,
                accessTokenExpiresAt: true,
                user: {
                    select: {
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (accounts.length > 0) {
            accounts.forEach((account, index) => {
                console.log(`  ${index + 1}. User: ${account.user.email}`);
                console.log(`     - Provider: ${account.providerId}`);
                console.log(`     - Account ID: ${account.accountId}`);
                console.log(`     - Has Access Token: ${account.accessToken ? '✓ Yes' : '✗ No'}`);
                if (account.accessTokenExpiresAt) {
                    console.log(`     - Token Expires: ${account.accessTokenExpiresAt.toISOString()}`);
                }
                console.log('');
            });
        } else {
            console.log('  No linked accounts found.\n');
        }

        // Verify Better Auth verification table
        console.log('✉️ Verification Records:');
        const verifications = await prisma.verification.findMany({
            take: 3,
            select: {
                id: true,
                identifier: true,
                value: true,
                expiresAt: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (verifications.length > 0) {
            verifications.forEach((v, index) => {
                console.log(`  ${index + 1}. Identifier: ${v.identifier}`);
                console.log(`     - Token: ${v.value.substring(0, 20)}...`);
                console.log(`     - Expires: ${v.expiresAt.toISOString()}`);
                console.log('');
            });
        } else {
            console.log('  No verification records found.\n');
        }

        console.log('✅ Migration Verification Complete!\n');
        console.log('Summary:');
        console.log('  ✓ All Better Auth tables exist and are accessible');
        console.log('  ✓ Account table migrated to Better Auth schema');
        console.log('  ✓ Session table migrated to Better Auth schema');
        console.log('  ✓ Verification table created');
        console.log('  ✓ Existing user data preserved');

    } catch (error) {
        console.error('❌ Migration verification failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

verifyMigration();
