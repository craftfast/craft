import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if user has a credential account (password-based)
        const credentialAccount = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                providerId: "credential",
            },
        });

        return NextResponse.json({ hasPassword: !!credentialAccount });
    } catch (error) {
        console.error("Error checking password status:", error);
        return NextResponse.json(
            { error: "Failed to check password status" },
            { status: 500 }
        );
    }
}
