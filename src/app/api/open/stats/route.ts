/**
 * Public Open Stats API
 *
 * GET /api/open/stats - Get public transparency metrics
 * 
 * This API returns aggregated, non-sensitive metrics for the /open page
 * Similar to cal.com's open company model
 * 
 * Security measures:
 * - Rate limiting (10 requests per minute per IP)
 * - Response caching (24 hours) - stats update daily
 * - No personal/sensitive data exposed
 * - Input validation on period parameter
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Ratelimit } from "@upstash/ratelimit";
import { redis, isRedisConfigured, REDIS_PREFIXES, REDIS_TTL } from "@/lib/redis-client";
import type { Redis } from "@upstash/redis";

// Force dynamic rendering since this route uses request.headers for rate limiting
export const dynamic = 'force-dynamic';

// Cache the response for 24 hours - stats only need daily updates
export const revalidate = 86400; // 24 hours

const STATS_CACHE_PREFIX = REDIS_PREFIXES.STATS_CACHE;
const STATS_CACHE_TTL = REDIS_TTL.LONG;

// Create rate limiter conditionally (check at runtime)
async function getPublicRateLimiter() {
    if (await isRedisConfigured()) {
        return new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(10, "1 m"),
            analytics: true,
            prefix: REDIS_PREFIXES.RATE_LIMIT_PUBLIC,
        });
    }
    return null;
}

// Valid period values (whitelist approach)
const VALID_PERIODS = new Set(["7d", "30d", "90d", "all"]);

export async function GET(request: NextRequest) {
    try {
        // === RATE LIMITING ===
        // Get client IP for rate limiting
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "anonymous";

        const publicRateLimiter = await getPublicRateLimiter();
        if (publicRateLimiter) {
            const { success, limit, remaining, reset } = await publicRateLimiter.limit(ip);

            if (!success) {
                return NextResponse.json(
                    { error: "Too many requests. Please try again later." },
                    {
                        status: 429,
                        headers: {
                            "X-RateLimit-Limit": limit.toString(),
                            "X-RateLimit-Remaining": remaining.toString(),
                            "X-RateLimit-Reset": reset.toString(),
                            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
                        },
                    }
                );
            }
        }

        // === INPUT VALIDATION ===
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "30d";

        // Validate period parameter (whitelist approach)
        if (!VALID_PERIODS.has(period)) {
            return NextResponse.json(
                { error: "Invalid period. Use: 7d, 30d, 90d, or all" },
                { status: 400 }
            );
        }

        // === REDIS CACHE CHECK ===
        // Return cached response if still valid (reduces DB load during traffic spikes)
        const cacheKey = `${STATS_CACHE_PREFIX}:${period}`;

        if (await isRedisConfigured()) {
            try {
                const cached = await redis.get<string>(cacheKey);
                if (cached) {
                    const data = JSON.parse(cached);
                    return NextResponse.json(data, {
                        headers: {
                            "X-Cache": "HIT",
                            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
                        },
                    });
                }
            } catch (error) {
                console.error("Redis cache read error:", error);
            }
        }

        // Calculate date ranges
        const now = new Date();
        let daysBack = 30;
        switch (period) {
            case "7d":
                daysBack = 7;
                break;
            case "30d":
                daysBack = 30;
                break;
            case "90d":
                daysBack = 90;
                break;
            case "all":
                daysBack = 365 * 10; // Effectively all time
                break;
        }

        const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        const previousStartDate = new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

        // Get aggregated metrics (no personal data)
        const [
            totalUsers,
            newUsers,
            previousUsers,
            totalProjects,
            newProjects,
            previousProjects,
            totalAiCalls,
            previousAiCalls,
            aiUsageByModel,
            totalTokensAggregate,
            totalFiles,
        ] = await Promise.all([
            // Total users
            prisma.user.count({ where: { deletedAt: null } }),

            // New users in period
            prisma.user.count({
                where: {
                    deletedAt: null,
                    createdAt: { gte: startDate },
                },
            }),

            // Previous period users (for comparison)
            prisma.user.count({
                where: {
                    deletedAt: null,
                    createdAt: { gte: previousStartDate, lt: startDate },
                },
            }),

            // Total projects
            prisma.project.count(),

            // New projects in period
            prisma.project.count({
                where: { createdAt: { gte: startDate } },
            }),

            // Previous period projects
            prisma.project.count({
                where: { createdAt: { gte: previousStartDate, lt: startDate } },
            }),

            // AI calls in period
            prisma.aICreditUsage.count({
                where: { createdAt: { gte: startDate } },
            }),

            // Previous period AI calls
            prisma.aICreditUsage.count({
                where: { createdAt: { gte: previousStartDate, lt: startDate } },
            }),

            // AI usage by model (aggregated)
            prisma.aICreditUsage.groupBy({
                by: ["model"],
                where: { createdAt: { gte: startDate } },
                _count: true,
                _sum: {
                    inputTokens: true,
                    outputTokens: true,
                },
                orderBy: { _count: { model: "desc" } },
                take: 10,
            }),

            // Total tokens processed (all time) - for impressive stats
            prisma.aICreditUsage.aggregate({
                _sum: {
                    inputTokens: true,
                    outputTokens: true,
                },
            }),

            // Total files created (estimate from project count * avg files)
            prisma.file.count(),
        ]);

        // Fetch GitHub stats (cached separately, doesn't block main query)
        let githubStats = { stars: 0, forks: 0, openIssues: 0 };
        try {
            const githubResponse = await fetch(
                "https://api.github.com/repos/craftfast/craft",
                {
                    headers: {
                        "Accept": "application/vnd.github.v3+json",
                        "User-Agent": "Craft-Open-Stats",
                    },
                    next: { revalidate: 86400 }, // Cache for 24 hours
                }
            );
            if (githubResponse.ok) {
                const githubData = await githubResponse.json();
                githubStats = {
                    stars: githubData.stargazers_count || 0,
                    forks: githubData.forks_count || 0,
                    openIssues: githubData.open_issues_count || 0,
                };
            }
        } catch {
            // GitHub API failed, use cached/default values
            console.warn("Failed to fetch GitHub stats");
        }

        // Get user growth data using Prisma (avoid raw SQL)
        const usersInPeriod = await prisma.user.findMany({
            where: {
                createdAt: { gte: startDate },
                deletedAt: null,
            },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
        });

        // Group users by date
        const userGrowthMap = new Map<string, number>();
        usersInPeriod.forEach((user) => {
            const dateStr = user.createdAt.toISOString().split("T")[0];
            userGrowthMap.set(dateStr, (userGrowthMap.get(dateStr) || 0) + 1);
        });
        const userGrowth = Array.from(userGrowthMap.entries()).map(([date, count]) => ({
            date,
            count,
        }));

        // Get project growth data using Prisma
        const projectsInPeriod = await prisma.project.findMany({
            where: {
                createdAt: { gte: startDate },
            },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
        });

        // Group projects by date
        const projectGrowthMap = new Map<string, number>();
        projectsInPeriod.forEach((project) => {
            const dateStr = project.createdAt.toISOString().split("T")[0];
            projectGrowthMap.set(dateStr, (projectGrowthMap.get(dateStr) || 0) + 1);
        });
        const projectGrowth = Array.from(projectGrowthMap.entries()).map(([date, count]) => ({
            date,
            count,
        }));

        // Calculate percentage changes
        const userChange = previousUsers > 0
            ? ((newUsers - previousUsers) / previousUsers) * 100
            : newUsers > 0 ? 100 : 0;

        const projectChange = previousProjects > 0
            ? ((newProjects - previousProjects) / previousProjects) * 100
            : newProjects > 0 ? 100 : 0;

        const aiCallsChange = previousAiCalls > 0
            ? ((totalAiCalls - previousAiCalls) / previousAiCalls) * 100
            : totalAiCalls > 0 ? 100 : 0;

        // Format model usage (hide sensitive cost data)
        const modelUsage = aiUsageByModel.map((m) => ({
            model: m.model,
            calls: m._count,
            tokens: (m._sum.inputTokens || 0) + (m._sum.outputTokens || 0),
        }));

        // Calculate total tokens
        const totalTokens = (totalTokensAggregate._sum.inputTokens || 0) +
            (totalTokensAggregate._sum.outputTokens || 0);

        const responseData = {
            summary: {
                totalUsers,
                newUsers,
                userChange: Math.round(userChange * 10) / 10,
                totalProjects,
                newProjects,
                projectChange: Math.round(projectChange * 10) / 10,
                totalAiCalls,
                aiCallsChange: Math.round(aiCallsChange * 10) / 10,
                totalTokens,
                totalFiles,
            },
            github: githubStats,
            modelUsage,
            userGrowth,
            projectGrowth,
            period,
            generatedAt: now.toISOString(),
        };

        // Update Redis cache
        if (await isRedisConfigured()) {
            try {
                await redis.set(cacheKey, JSON.stringify(responseData), { ex: STATS_CACHE_TTL });
            } catch (error) {
                console.error("Redis cache write error:", error);
            }
        }

        return NextResponse.json(responseData, {
            headers: {
                "X-Cache": "MISS",
                "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
            },
        });
    } catch (error) {
        console.error("Error fetching open stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
