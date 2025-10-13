# Team Switching - Quick Reference

## 🎯 What Was Implemented

A complete team switching system that allows users to switch between teams they're members of.

## 📦 Files Added

```
src/components/TeamSwitcher.tsx          # Dropdown component
src/app/api/teams/route.ts               # GET user's teams
src/app/api/teams/switch/route.ts        # POST switch team
docs/team-switching-implementation.md    # Full documentation
```

## 🔧 Files Modified

```
src/lib/team.ts                          # Added getUserTeams(), getTeamById()
src/components/DashboardHeader.tsx       # Integrated TeamSwitcher
src/app/dashboard/page.tsx               # Team selection from cookie
src/app/projects/page.tsx                # Team selection from cookie
```

## 🚀 How It Works

### For Users

1. Click the chevron icon next to team name in header
2. See list of all teams you're a member of
3. Click a team to switch to it
4. Page refreshes with new team context

### For Developers

**Get all user's teams:**

```typescript
import { getUserTeams } from "@/lib/team";

const teams = await getUserTeams(userId);
```

**Get a specific team:**

```typescript
import { getTeamById } from "@/lib/team";

const team = await getTeamById(teamId, userId);
```

**API Endpoints:**

```typescript
// Get user's teams
GET /api/teams

// Switch active team
POST /api/teams/switch
Body: { teamId: "team_123" }
```

**In a page component:**

```typescript
import { cookies } from "next/headers";
import { getTeamById, getUserPersonalTeam } from "@/lib/team";

// Get selected team from cookie
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

## 🎨 Component Usage

```tsx
import TeamSwitcher from "@/components/TeamSwitcher";

<TeamSwitcher
  currentTeam={{
    id: team.id,
    name: team.name,
    subscription: team.subscription,
  }}
/>;
```

## 🔐 Security

- ✅ HttpOnly cookies (no JS access)
- ✅ Team membership validation
- ✅ Session authentication required
- ✅ Authorization checks on all endpoints

## 📱 UI Features

- Personal team icon vs. team icon
- Role badge (owner/admin/member)
- Plan badge (Hobby/Pro)
- Current team checkmark
- Click outside to close
- Smooth animations
- Dark mode support
- Mobile responsive

## 🎯 State Management

**Cookie:** `selectedTeamId`

- Stores currently selected team
- Expires after 30 days
- HttpOnly, Secure, SameSite=lax

**Fallback:** Personal team

- If no cookie set
- If selected team not found
- If user removed from team

## 🔄 Page Refresh Flow

1. User clicks team in dropdown
2. `POST /api/teams/switch` sets cookie
3. `router.refresh()` reloads page
4. Page reads `selectedTeamId` cookie
5. Fetches team details
6. Renders with new team context

## 📊 Team List Display

```
┌─────────────────────────────────────┐
│  Switch Team                        │
├─────────────────────────────────────┤
│  👤  John's Team        Hobby    ✓  │  ← Personal, current
│  👥  Work Team          Pro         │  ← Team
│  👥  Client Project     Hobby       │  ← Team
├─────────────────────────────────────┤
│  ➕  Create new team                │  ← Future feature
└─────────────────────────────────────┘
```

## 🧪 Testing

```bash
# 1. Sign in as a user
# 2. Check header shows team name
# 3. Click chevron to open dropdown
# 4. Should see list of teams
# 5. Click a different team
# 6. Page should reload with new team
# 7. Check cookie is set in DevTools
# 8. Refresh page - should stay on selected team
```

## 🐛 Troubleshooting

**Dropdown not opening?**

- Check TeamSwitcher is receiving currentTeam prop
- Verify teamId is not null/undefined

**Teams not loading?**

- Check `/api/teams` endpoint response
- Verify user is authenticated
- Check browser console for errors

**Team switch not working?**

- Check `/api/teams/switch` endpoint
- Verify cookie is being set
- Check user is member of target team

**Falls back to personal team?**

- Cookie may have expired
- User may have been removed from team
- Team may have been deleted

## 🚦 Next Steps

To add team switching to a new page:

1. Import functions:

   ```typescript
   import { cookies } from "next/headers";
   import { getTeamById, getUserPersonalTeam } from "@/lib/team";
   ```

2. Get team in page component:

   ```typescript
   const cookieStore = await cookies();
   const selectedTeamId = cookieStore.get("selectedTeamId")?.value;

   let team;
   if (selectedTeamId) {
     team = await getTeamById(selectedTeamId, session.user.id);
   }
   if (!team) {
     team = await getUserPersonalTeam(session.user.id);
   }
   ```

3. Pass to DashboardHeader:
   ```tsx
   <DashboardHeader
     title={team?.name}
     planName={team?.subscription?.plan?.name}
     teamId={team?.id}
     teamSubscription={team?.subscription}
   />
   ```

Done! ✅
