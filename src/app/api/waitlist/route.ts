import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        // Validate email
        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (!validateEmail(normalizedEmail)) {
            return NextResponse.json(
                { error: 'Please enter a valid email address' },
                { status: 400 }
            );
        }

        try {
            // Try to create a new waitlist entry
            const newEntry = await prisma.waitlistEntry.create({
                data: {
                    email: normalizedEmail,
                },
            });

            // Get the current count
            const totalCount = await prisma.waitlistEntry.count();

            console.log(`New waitlist signup: ${normalizedEmail}`);

            return NextResponse.json(
                {
                    message: 'Successfully joined the waitlist!',
                    position: totalCount,
                    id: newEntry.id
                },
                { status: 201 }
            );

        } catch (dbError: unknown) {
            // Handle unique constraint violation (Prisma error P2002)
            if (
                typeof dbError === 'object' &&
                dbError !== null &&
                'code' in dbError &&
                dbError.code === 'P2002' &&
                'meta' in dbError &&
                typeof dbError.meta === 'object' &&
                dbError.meta !== null &&
                'target' in dbError.meta &&
                Array.isArray(dbError.meta.target) &&
                dbError.meta.target.includes('email')
            ) {
                return NextResponse.json(
                    { error: 'This email is already on the waitlist' },
                    { status: 409 }
                );
            }

            console.error('Database error:', dbError);
            return NextResponse.json(
                { error: 'Database error occurred' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Waitlist API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const count = await prisma.waitlistEntry.count();

        return NextResponse.json({
            count,
            message: `${count} people on the waitlist`
        });
    } catch (error) {
        console.error('Waitlist GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}