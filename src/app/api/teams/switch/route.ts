import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTeamById } from "@/lib/team";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

// POST /api/teams/switch - Switch to a different team
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { teamId } = await req.json();

        if (!teamId) {
            return NextResponse.json(
                { error: "Team ID is required" },
                { status: 400 }
            );
        }

        // Verify user is a member of the team
        const team = await getTeamById(teamId, user.id);

        if (!team) {
            return NextResponse.json(
                { error: "Team not found or access denied" },
                { status: 404 }
            );
        }

        // Set the selected team in a cookie
        const cookieStore = await cookies();
        cookieStore.set("selectedTeamId", teamId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return NextResponse.json({
            success: true,
            team: {
                id: team.id,
                name: team.name,
                slug: team.slug,
            },
        });
    } catch (error) {
        console.error("Error switching team:", error);
        return NextResponse.json(
            { error: "Failed to switch team" },
            { status: 500 }
        );
    }
}
