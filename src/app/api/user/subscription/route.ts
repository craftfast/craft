import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get the user from the database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Fetch user's subscription with plan details
        const subscription = await prisma.userSubscription.findUnique({
            where: { userId: user.id },
            include: {
                plan: true,
            },
        });

        if (!subscription) {
            // User doesn't have a subscription, they're on the default Hobby plan
            return NextResponse.json({
                plan: "HOBBY",
                displayName: "Hobby",
                status: "active",
            });
        }

        return NextResponse.json({
            plan: subscription.plan.name,
            displayName: subscription.plan.displayName,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        });
    } catch (error) {
        console.error("Error fetching user subscription:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscription" },
            { status: 500 }
        );
    }
}
