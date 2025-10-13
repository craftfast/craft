import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserTeams } from "@/lib/team";
import { prisma } from "@/lib/db";

// GET /api/teams - Get all teams the user is a member of
export async function GET() {
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

        const teams = await getUserTeams(user.id);

        return NextResponse.json({ teams }, { status: 200 });
    } catch (error) {
        console.error("Error fetching teams:", error);
        return NextResponse.json(
            { error: "Failed to fetch teams" },
            { status: 500 }
        );
    }
}
