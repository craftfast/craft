import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// Re-export Prisma namespace for types like Prisma.DbNull, Prisma.JsonNull
export { Prisma }

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Create Neon adapter with connection string
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: process.env.PRISMA_QUERY_LOGS === 'true' ? ['query'] : [],
    })

// Optimize connection pooling for serverless
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

// Pre-warm connection on startup
if (typeof window === 'undefined') {
    prisma.$connect().catch(console.error)
}