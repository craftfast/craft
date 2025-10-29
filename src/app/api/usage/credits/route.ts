import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const projectId = searchParams.get("projectId") || undefined;
        const endpoint = searchParams.get("endpoint") || undefined;
        const startDate = searchParams.get("startDate")
            ? new Date(searchParams.get("startDate")!)
            : undefined;
        const endDate = searchParams.get("endDate")
            ? new Date(searchParams.get("endDate")!)
            : undefined;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {
            userId: user.id,
        };

        if (projectId) {
            where.projectId = projectId;
        }

        if (endpoint) {
            where.endpoint = endpoint;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = startDate;
            }
            if (endDate) {
                where.createdAt.lte = endDate;
            }
        }

        // Get total count for pagination
        const totalCount = await prisma.aICreditUsage.count({ where });

        // Get paginated records
        const records = await prisma.aICreditUsage.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });

        // Get project names for records
        const projectIds = [...new Set(records.map((r) => r.projectId))];
        const projects = await prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, name: true },
        });
        const projectMap = new Map(projects.map((p) => [p.id, p.name]));

        // Get unique projects for filter
        const allProjects = await prisma.project.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: "asc" },
        });

        // Get unique endpoints for filter
        const endpoints = await prisma.aICreditUsage.findMany({
            where: { userId: user.id, endpoint: { not: null } },
            select: { endpoint: true },
            distinct: ["endpoint"],
        });

        return NextResponse.json({
            records: records.map((record) => ({
                id: record.id,
                projectId: record.projectId,
                projectName: projectMap.get(record.projectId) || "Unknown Project",
                model: record.model,
                inputTokens: record.inputTokens,
                outputTokens: record.outputTokens,
                totalTokens: record.totalTokens,
                costUsd: record.costUsd,
                // Credits with model-based multipliers (now stored in DB)
                creditsUsed: Number(record.creditsUsed),
                modelMultiplier: record.modelMultiplier,
                callType: record.callType || "agent",
                endpoint: record.endpoint || "chat",
                createdAt: record.createdAt,
            })),
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
            filters: {
                projects: allProjects,
                endpoints: endpoints
                    .map((e) => e.endpoint)
                    .filter((e): e is string => e !== null),
            },
        });
    } catch (error) {
        console.error("Error fetching credit usage:", error);
        return NextResponse.json(
            { error: "Failed to fetch credit usage data" },
            { status: 500 }
        );
    }
}
