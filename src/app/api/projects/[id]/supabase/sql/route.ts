import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import {
    executeQuery,
    isSupabaseConfigured,
} from "@/lib/services/supabase-platforms";

/**
 * POST /api/projects/[id]/supabase/sql
 * Execute SQL queries on the project's Supabase database
 * 
 * This endpoint allows:
 * - AI agents to run migrations when they can't connect from E2B sandbox
 * - Creating tables, indexes, and RLS policies
 * - Running data operations (with appropriate limits)
 * 
 * Security:
 * - Only project owner can execute SQL
 * - CSRF protection required
 * - Query validation to prevent destructive operations without explicit flag
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;
        const body = await req.json();

        const { sql, allowDestructive = false, operation = "query" } = body as {
            sql: string;
            allowDestructive?: boolean;
            operation?: "query" | "migration" | "schema";
        };

        if (!sql || typeof sql !== "string") {
            return NextResponse.json(
                { error: "SQL query is required" },
                { status: 400 }
            );
        }

        // Check if Supabase for Platforms is configured
        if (!isSupabaseConfigured()) {
            return NextResponse.json(
                { error: "Supabase for Platforms is not configured" },
                { status: 503 }
            );
        }

        // Verify project ownership and get Supabase credentials
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
            select: {
                id: true,
                name: true,
                supabaseProjectRef: true,
                supabaseStatus: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        if (!project.supabaseProjectRef) {
            return NextResponse.json(
                { error: "Supabase is not provisioned for this project" },
                { status: 400 }
            );
        }

        if (project.supabaseStatus !== "active") {
            return NextResponse.json(
                {
                    error: "Supabase is not active. Current status: " + project.supabaseStatus,
                    status: project.supabaseStatus
                },
                { status: 400 }
            );
        }

        // Validate SQL to prevent dangerous operations without explicit consent
        const upperSql = sql.toUpperCase().trim();
        const destructivePatterns = [
            /DROP\s+(TABLE|DATABASE|SCHEMA|INDEX|FUNCTION|TRIGGER|POLICY)/i,
            /TRUNCATE/i,
            /DELETE\s+FROM\s+\w+\s*(;|$)/i, // DELETE without WHERE
        ];

        const isDestructive = destructivePatterns.some(pattern => pattern.test(sql));

        if (isDestructive && !allowDestructive) {
            return NextResponse.json(
                {
                    error: "Destructive SQL detected. Set allowDestructive: true to execute.",
                    warning: "This operation may permanently delete data."
                },
                { status: 400 }
            );
        }

        // Log the operation for audit
        console.log(`📊 Executing SQL on project ${project.name} (${project.supabaseProjectRef}):`);
        console.log(`   Operation: ${operation}`);
        console.log(`   SQL: ${sql.substring(0, 200)}${sql.length > 200 ? "..." : ""}`);

        try {
            // Execute the query using Supabase Management API
            const result = await executeQuery(project.supabaseProjectRef, sql);

            console.log(`✅ SQL executed successfully`);

            return NextResponse.json({
                success: true,
                operation,
                result,
                message: operation === "migration"
                    ? "Migration executed successfully"
                    : operation === "schema"
                        ? "Schema updated successfully"
                        : "Query executed successfully"
            });

        } catch (queryError) {
            console.error("SQL execution failed:", queryError);

            const errorMessage = queryError instanceof Error
                ? queryError.message
                : "Failed to execute SQL";

            return NextResponse.json(
                {
                    error: errorMessage,
                    details: queryError instanceof Error && "cause" in queryError
                        ? String(queryError.cause)
                        : undefined
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Supabase SQL endpoint error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/projects/[id]/supabase/sql
 * Get database schema information
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;

        // Check if Supabase for Platforms is configured
        if (!isSupabaseConfigured()) {
            return NextResponse.json(
                { error: "Supabase for Platforms is not configured" },
                { status: 503 }
            );
        }

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
            select: {
                id: true,
                supabaseProjectRef: true,
                supabaseStatus: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        if (!project.supabaseProjectRef) {
            return NextResponse.json(
                { error: "Supabase is not provisioned for this project" },
                { status: 400 }
            );
        }

        // Get list of tables in public schema
        const tablesQuery = `
            SELECT 
                table_name,
                (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND columns.table_name = tables.table_name) as column_count
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

        try {
            const result = await executeQuery(project.supabaseProjectRef, tablesQuery);

            return NextResponse.json({
                success: true,
                tables: result,
            });
        } catch (queryError) {
            console.error("Failed to get schema:", queryError);
            return NextResponse.json(
                { error: "Failed to retrieve database schema" },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Supabase schema endpoint error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
