import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.PRISMA_QUERY_LOGS === 'true' ? ['query'] : [],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    })

// Optimize connection pooling for serverless
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

// Pre-warm connection on startup
if (typeof window === 'undefined') {
    prisma.$connect().catch(console.error)
}