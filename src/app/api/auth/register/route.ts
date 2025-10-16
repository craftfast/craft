import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { assignPlanToUser } from "@/lib/subscription";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user (no team needed - direct user subscriptions)
        const user = await prisma.user.create({
            data: {
                email,
                name: name || null,
                password: hashedPassword,
            },
        });

        console.log(`✅ User created: ${user.email}`);

        // Assign default Hobby plan to new user
        try {
            await assignPlanToUser(user.id, "HOBBY");
            console.log(`✅ Hobby plan assigned to user: ${user.email}`);
        } catch (planError) {
            console.error("Error assigning Hobby plan:", planError);
            // Don't fail the registration if plan assignment fails
            // The user can still use the app with default limits
        }

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
