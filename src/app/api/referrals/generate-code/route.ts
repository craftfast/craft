import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { nanoid } from "nanoid";

// Create a custom alphabet generator for referral codes
const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

/**
 * POST /api/referrals/generate-code
 * Generate a unique referral code for the authenticated user
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if user already has a referral code
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { referralCode: true },
        });

        if (user?.referralCode) {
            return NextResponse.json({
                referralCode: user.referralCode,
                message: "Referral code already exists",
            });
        }

        // Generate unique referral code
        let referralCode: string;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            referralCode = generateCode();
            const existing = await prisma.user.findUnique({
                where: { referralCode },
            });

            if (!existing) break;

            attempts++;
            if (attempts >= maxAttempts) {
                return NextResponse.json(
                    { error: "Failed to generate unique referral code" },
                    { status: 500 }
                );
            }
        } while (true);

        // Update user with referral code
        await prisma.user.update({
            where: { id: session.user.id },
            data: { referralCode },
        });

        return NextResponse.json({
            referralCode,
            message: "Referral code generated successfully",
        });
    } catch (error) {
        console.error("Error generating referral code:", error);
        return NextResponse.json(
            { error: "Failed to generate referral code" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/referrals/generate-code
 * Get the current user's referral code (or generate if not exists)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { referralCode: true },
        });

        if (user?.referralCode) {
            return NextResponse.json({
                referralCode: user.referralCode,
            });
        }

        // Auto-generate if not exists
        let referralCode: string;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            referralCode = generateCode();
            const existing = await prisma.user.findUnique({
                where: { referralCode },
            });

            if (!existing) break;

            attempts++;
            if (attempts >= maxAttempts) {
                return NextResponse.json(
                    { error: "Failed to generate unique referral code" },
                    { status: 500 }
                );
            }
        } while (true);

        await prisma.user.update({
            where: { id: session.user.id },
            data: { referralCode },
        });

        return NextResponse.json({
            referralCode,
        });
    } catch (error) {
        console.error("Error getting referral code:", error);
        return NextResponse.json(
            { error: "Failed to get referral code" },
            { status: 500 }
        );
    }
}
