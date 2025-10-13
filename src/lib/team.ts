import { prisma } from "@/lib/db";

/**
 * Create a default personal team for a new user
 * @param userId - The user's ID
 * @param userName - The user's name (we'll use first name for team name)
 * @param userEmail - The user's email (used as fallback for team name)
 * @returns The created team
 */
export async function createDefaultPersonalTeam(
    userId: string,
    userName: string | null | undefined,
    userEmail: string
) {
    // Extract first name from full name, or use email prefix as fallback
    let teamName = "My Team";
    if (userName) {
        // Split on space and use first part, or entire name if no space exists
        const firstName = userName.trim().split(" ")[0];
        teamName = `${firstName}'s Team`;
    } else {
        const emailPrefix = userEmail.split("@")[0];
        teamName = `${emailPrefix}'s Team`;
    }

    // Create a unique slug from the team name and user ID
    const baseSlug = teamName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${userId.slice(0, 8)}`;

    // Create the team and add the user as owner/member in a transaction
    const team = await prisma.team.create({
        data: {
            name: teamName,
            slug: slug,
            ownerId: userId,
            isPersonal: true,
            members: {
                create: {
                    userId: userId,
                    role: "owner",
                },
            },
        },
        include: {
            members: true,
        },
    });

    console.log(`✅ Created personal team "${teamName}" for user ${userId}`);

    return team;
}

/**
 * Check if a user already has a personal team
 * @param userId - The user's ID
 * @returns True if the user has a personal team, false otherwise
 */
export async function hasPersonalTeam(userId: string): Promise<boolean> {
    const personalTeam = await prisma.team.findFirst({
        where: {
            ownerId: userId,
            isPersonal: true,
        },
    });

    return !!personalTeam;
}

/**
 * Get the user's personal team
 * @param userId - The user's ID
 * @returns The user's personal team or null if not found
 */
export async function getUserPersonalTeam(userId: string) {
    const personalTeam = await prisma.team.findFirst({
        where: {
            ownerId: userId,
            isPersonal: true,
        },
        select: {
            id: true,
            name: true,
            slug: true,
        },
    });

    return personalTeam;
}
