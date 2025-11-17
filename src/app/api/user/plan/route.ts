import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

// GET /api/user/plan - Get the current user's subscription plan
export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the user from the database with subscription
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Return user's subscription plan or default HOBBY
        const planName = user.subscription?.plan.name || "HOBBY";
        const displayName = user.subscription?.plan.displayName || "Hobby";

        return NextResponse.json({
            plan: planName,
            displayName: displayName,
            userId: user.id,
        });
    } catch (error) {
        console.error("Error fetching user plan:", error);
        return NextResponse.json(
            { error: "Failed to fetch user plan" },
            { status: 500 }
        );
    }
}
