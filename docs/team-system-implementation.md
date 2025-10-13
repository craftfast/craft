# Team System Implementation

## Overview

We've implemented a team-based organization system for Craft. Each user gets a default personal team when they sign up, and they can create multiple teams later.

## Database Schema

### Team Model

```prisma
model Team {
  id          String        @id @default(cuid())
  name        String
  slug        String        @unique // URL-friendly identifier
  ownerId     String
  isPersonal  Boolean       @default(false) // True if this is the user's default personal team
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  owner       User          @relation("TeamOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     TeamMember[]

  @@index([ownerId])
  @@index([isPersonal])
  @@map("teams")
}
```

### TeamMember Model

```prisma
model TeamMember {
  id          String   @id @default(cuid())
  teamId      String
  userId      String
  role        String   @default("member") // "owner", "admin", "member"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId]) // User can only be a member once per team
  @@index([userId])
  @@index([teamId])
  @@map("team_members")
}
```

## Key Features

### 1. Default Personal Team

Every new user gets a default personal team created automatically:

- **Team Name**: Uses the user's first name + "'s Team" (e.g., "John's Team")
- **Fallback**: If no name is provided, uses email prefix (e.g., "john-doe's Team")
- **isPersonal**: Marked as `true` to identify it as the default personal team
- **Owner Role**: User is automatically added as a team member with "owner" role

### 2. Team Slug

Each team gets a unique URL-friendly slug:

- Format: `{team-name}-{user-id-prefix}`
- Example: `johns-team-abc12345`
- Ensures uniqueness across all teams

### 3. Team Roles

Three role levels for team members:

- **owner**: Full control, can delete team
- **admin**: Can manage members and settings
- **member**: Basic access

## Implementation Details

### Helper Functions (`src/lib/team.ts`)

#### `createDefaultPersonalTeam(userId, userName, userEmail)`

Creates a default personal team for a new user:

```typescript
const team = await createDefaultPersonalTeam(
  user.id,
  user.name,
  user.email
);
```

#### `hasPersonalTeam(userId)`

Checks if a user already has a personal team:

```typescript
const hasTeam = await hasPersonalTeam(user.id);
```

### OAuth Signup Flow

When a user signs up via Google or GitHub:

1. NextAuth creates the user via `PrismaAdapter`
2. `createUser` event fires in `src/lib/auth.ts`
3. Checks if user already has a personal team (prevents duplicates)
4. Creates default personal team if none exists

### Email/Password Signup Flow

When a user signs up via email/password:

1. User submits registration form
2. `POST /api/auth/register` endpoint creates user
3. Immediately creates default personal team
4. Returns user data

## Testing

To run the migration and set up the database:

```bash
npx prisma migrate dev --name add_teams
```

To test the system:

1. **Google OAuth Signup**:

   - Sign up with Google
   - Check database: should have a team with `isPersonal: true`
   - Team name should use your first name from Google profile

2. **GitHub OAuth Signup**:

   - Sign up with GitHub
   - Check database: should have a personal team
   - Team name should use your first name from GitHub profile

3. **Email/Password Signup**:
   - Register with email and password
   - Provide a name in the registration form
   - Check database: should have a personal team
   - Team name should use your first name

## Future Enhancements

### Planned Features

- [ ] Team creation UI (allow users to create additional teams)
- [ ] Team member invitation system
- [ ] Team switching in the UI
- [ ] Team-scoped projects (projects belong to teams instead of users)
- [ ] Team settings page
- [ ] Team member management (add/remove members, change roles)
- [ ] Team billing (separate billing per team)

### API Endpoints to Create

- `POST /api/teams` - Create a new team
- `GET /api/teams` - List user's teams
- `GET /api/teams/:id` - Get team details
- `PATCH /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Invite member
- `DELETE /api/teams/:id/members/:userId` - Remove member
- `PATCH /api/teams/:id/members/:userId` - Update member role

## Migration Guide

### Running the Migration

```bash
npx prisma migrate dev --name add_teams
```

This will:

1. Create the `teams` table
2. Create the `team_members` table
3. Add relationships to the `users` table
4. Create necessary indexes

### Checking Migration Status

```bash
npx prisma migrate status
```

### Viewing Database in Prisma Studio

```bash
npx prisma studio
```

Navigate to the Teams and TeamMembers tables to see the data.

## Notes

- Personal teams cannot be deleted (future feature)
- Users can have multiple teams (as owner or member)
- Team slugs must be unique across the entire platform
- The first member of a team is always the owner
