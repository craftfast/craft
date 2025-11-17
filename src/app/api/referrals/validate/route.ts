import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/referrals/validate
 * Validate if a referral code exists
 */
export async function POST(request: NextRequest) {
    try {
        const { referralCode } = await request.json();

        if (!referralCode || typeof referralCode !== "string") {
            return NextResponse.json(
                { error: "Invalid referral code" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { referralCode: referralCode.toUpperCase() },
            select: {
                id: true,
                name: true,
            },
        });

        if (!user) {
            return NextResponse.json({
                valid: false,
                message: "Invalid referral code",
            });
        }

        return NextResponse.json({
            valid: true,
            message: "Valid referral code",
            referrerName: user.name,
        });
    } catch (error) {
        console.error("Error validating referral code:", error);
        return NextResponse.json(
            { error: "Failed to validate referral code" },
            { status: 500 }
        );
    }
}
