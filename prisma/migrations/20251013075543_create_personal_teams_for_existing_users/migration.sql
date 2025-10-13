-- Create personal teams for all existing users
INSERT INTO "public"."teams" ("id", "name", "slug", "ownerId", "isPersonal", "createdAt", "updatedAt")
SELECT 
    'team_' || u.id,
    COALESCE(u.name, 'My Team'),
    'personal_' || LOWER(REPLACE(u.id, '-', '_')),
    u.id,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "public"."users" u
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."teams" t 
    WHERE t."ownerId" = u.id AND t."isPersonal" = true
);

-- Create team member entries for all personal teams
INSERT INTO "public"."team_members" ("id", "teamId", "userId", "role", "createdAt", "updatedAt")
SELECT 
    'member_' || t.id,
    t.id,
    t."ownerId",
    'owner',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "public"."teams" t
WHERE t."isPersonal" = true
AND NOT EXISTS (
    SELECT 1 FROM "public"."team_members" tm 
    WHERE tm."teamId" = t.id AND tm."userId" = t."ownerId"
);