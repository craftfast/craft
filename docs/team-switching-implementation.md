# Team Switching Implementation

## Overview

The team switching functionality allows users to switch between different teams they are members of. This includes their personal team and any other teams they have been invited to.

## Architecture

### Database Schema

The team system uses the following models from Prisma:

```prisma
model Team {
  id           String            @id @default(cuid())
  name         String
  slug         String            @unique
  ownerId      String
  isPersonal   Boolean           @default(false)
  members      TeamMember[]
  subscription TeamSubscription?
}

model TeamMember {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  role      String   @default("member") // "owner", "admin", "member"
  team      Team     @relation(fields: [teamId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}
```

### Key Components

#### 1. **TeamSwitcher Component** (`src/components/TeamSwitcher.tsx`)

A dropdown component that:

- Displays all teams the user is a member of
- Shows team name, role, plan badge, and personal team indicator
- Allows switching between teams
- Highlights the currently active team
- Includes a "Create new team" button (future feature)

**Props:**

```typescript
{
  currentTeam: {
    id: string;
    name: string;
    subscription: {
      plan: {
        name: string;
        displayName: string;
      };
    } | null;
  };
}
```

#### 2. **DashboardHeader Component** (`src/components/DashboardHeader.tsx`)

Updated to include the TeamSwitcher:

- Displays current team name
- Shows plan badge (Hobby/Pro)
- Integrates TeamSwitcher dropdown
- Passes team context to child components

**New Props:**

```typescript
{
  title?: string;
  planName?: string;
  teamId?: string;  // NEW
  teamSubscription?: {  // NEW
    plan: {
      name: string;
      displayName: string;
    };
  } | null;
}
```

### API Endpoints

#### 1. **GET /api/teams**

Fetches all teams the authenticated user is a member of.

**Response:**

```json
{
  "teams": [
    {
      "id": "team_123",
      "name": "John's Team",
      "slug": "johns-team-abc12345",
      "isPersonal": true,
      "ownerId": "user_123",
      "role": "owner",
      "subscription": {
        "plan": {
          "name": "HOBBY",
          "displayName": "Hobby"
        }
      }
    }
    // ... more teams
  ]
}
```

#### 2. **POST /api/teams/switch**

Switches the user's active team by setting a cookie.

**Request:**

```json
{
  "teamId": "team_456"
}
```

**Response:**

```json
{
  "success": true,
  "team": {
    "id": "team_456",
    "name": "Work Team",
    "slug": "work-team-xyz"
  }
}
```

**Cookie Set:**

- Name: `selectedTeamId`
- Value: The team ID
- HttpOnly: `true`
- Secure: `true` (in production)
- SameSite: `lax`
- Max Age: 30 days

### Helper Functions

Updated `src/lib/team.ts` with new functions:

#### `getUserTeams(userId: string)`

Fetches all teams a user is a member of, ordered with personal team first.

```typescript
const teams = await getUserTeams(userId);
```

**Returns:**

```typescript
{
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
  ownerId: string;
  role: string; // from TeamMember
  subscription: {
    plan: {
      name: string;
      displayName: string;
    };
  } | null;
}[]
```

#### `getTeamById(teamId: string, userId: string)`

Fetches a specific team if the user is a member.

```typescript
const team = await getTeamById(teamId, userId);
```

**Returns:** Same structure as `getUserTeams`, but single object or `null`

### Page Updates

#### Dashboard Page (`src/app/dashboard/page.tsx`)

```typescript
// Try to get selected team from cookie
const cookieStore = await cookies();
const selectedTeamId = cookieStore.get("selectedTeamId")?.value;

let team;
if (selectedTeamId) {
  team = await getTeamById(selectedTeamId, session.user.id);
}

// Fallback to personal team
if (!team) {
  team = await getUserPersonalTeam(session.user.id);
}
```

#### Projects Page (`src/app/projects/page.tsx`)

Same logic as dashboard page - checks cookie for selected team, falls back to personal team.

## User Flow

1. **User clicks team switcher dropdown** in the header

   - Fetches all user's teams via `/api/teams`
   - Displays list with current team highlighted

2. **User selects a different team**

   - Calls `/api/teams/switch` with team ID
   - Sets `selectedTeamId` cookie
   - Refreshes the page

3. **Page loads with new team**

   - Reads `selectedTeamId` from cookie
   - Fetches team details via `getTeamById`
   - Displays team name and plan in header
   - All features now scoped to selected team

4. **Cookie persists across sessions**
   - Last selected team is remembered for 30 days
   - User doesn't need to re-select on each visit

## Security Considerations

1. **Authorization Checks**

   - API endpoints verify user session
   - `getTeamById` ensures user is a team member
   - Cannot access teams user doesn't belong to

2. **Cookie Security**

   - HttpOnly: Prevents JavaScript access
   - Secure: HTTPS only in production
   - SameSite: Protects against CSRF

3. **Team Membership Validation**
   - Every team access checks `TeamMember` relationship
   - Role-based access control ready for future features

## UI/UX Features

### Team Switcher Dropdown

- **Icons**: Personal team (user icon) vs. team (group icon)
- **Role Badge**: Shows user's role in each team
- **Plan Badge**: Displays Hobby/Pro plan for each team
- **Current Indicator**: Checkmark on active team
- **Smooth Animation**: Dropdown appears/closes smoothly
- **Click Outside**: Closes when clicking elsewhere
- **Keyboard Accessible**: Proper ARIA labels

### Visual States

1. **Closed State**: Chevron icon indicates dropdown
2. **Open State**: Chevron rotates 180°
3. **Hover State**: Team items highlight on hover
4. **Active State**: Current team has darker background + checkmark
5. **Loading State**: Shows "Loading teams..." message

## Future Enhancements

### Planned Features

- [ ] Create new team functionality
- [ ] Team settings page
- [ ] Team member management
- [ ] Team invitations
- [ ] Team-scoped projects (projects belong to teams)
- [ ] Team billing and usage tracking
- [ ] Role-based permissions (owner/admin/member)

### API Endpoints to Add

- `POST /api/teams` - Create new team
- `GET /api/teams/:id` - Get team details
- `PATCH /api/teams/:id` - Update team settings
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Invite member
- `DELETE /api/teams/:id/members/:userId` - Remove member
- `PATCH /api/teams/:id/members/:userId` - Update member role

## Testing Checklist

- [x] Fetch user's teams via API
- [x] Display teams in dropdown
- [x] Switch between teams
- [x] Cookie persistence
- [x] Personal team fallback
- [x] Authorization checks
- [x] Team not found handling
- [x] Loading states
- [x] Mobile responsive design
- [x] Dark mode support
- [ ] Create new team (TODO)
- [ ] Team member invitations (TODO)

## Files Changed

### New Files

- `src/components/TeamSwitcher.tsx` - Team switcher dropdown component
- `src/app/api/teams/route.ts` - GET endpoint for user's teams
- `src/app/api/teams/switch/route.ts` - POST endpoint to switch teams
- `docs/team-switching-implementation.md` - This documentation

### Modified Files

- `src/lib/team.ts` - Added `getUserTeams()` and `getTeamById()`
- `src/components/DashboardHeader.tsx` - Integrated TeamSwitcher
- `src/app/dashboard/page.tsx` - Team selection from cookie
- `src/app/projects/page.tsx` - Team selection from cookie

## Design System Compliance

✅ **Colors**: Uses neutral palette only (neutral-_, stone-_, gray-\*)  
✅ **Rounded Corners**: All interactive elements use rounded-lg/rounded-full  
✅ **Dark Mode**: Full dark mode support with dark: variants  
✅ **Accessibility**: Proper ARIA labels and keyboard navigation  
✅ **Responsive**: Works on mobile, tablet, and desktop

## Notes

- Personal teams are always shown first in the list
- Team slugs are unique across the platform
- Cookie expires after 30 days of inactivity
- If selected team is invalid, falls back to personal team
- Team switching refreshes the page to reload all data
