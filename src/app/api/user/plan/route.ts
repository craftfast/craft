import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/user/plan - Get the current user's subscription plan
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the user from the database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                teamMembers: {
                    include: {
                        team: {
                            include: {
                                subscription: {
                                    include: {
                                        plan: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get the user's personal team (first team, or primary team)
        const personalTeam = user.teamMembers.find((tm) => tm.team.isPersonal);
        const team = personalTeam?.team || user.teamMembers[0]?.team;

        if (!team) {
            // No team found, return default HOBBY plan
            return NextResponse.json({
                plan: "HOBBY",
                displayName: "Hobby",
                teamId: null,
            });
        }

        const planName = team.subscription?.plan.name || "HOBBY";
        const displayName = team.subscription?.plan.displayName || "Hobby";

        return NextResponse.json({
            plan: planName,
            displayName: displayName,
            teamId: team.id,
        });
    } catch (error) {
        console.error("Error fetching user plan:", error);
        return NextResponse.json(
            { error: "Failed to fetch user plan" },
            { status: 500 }
        );
    }
}
