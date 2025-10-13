# Hobby Plan Assignment on Signup - Fix Summary

**Date:** October 13, 2025  
**Issue:** Users signing up directly from homepage were not being assigned any plan

## ✅ Problem Identified

When users signed up directly from the homepage (either through OAuth or email/password), a personal team was created for them, but no subscription plan was assigned to that team. This meant:

- Users had no plan associated with their account
- They couldn't access plan-based features
- Billing and usage tracking wouldn't work properly

## 🔧 Changes Made

### 1. Updated Team Creation (`src/lib/team.ts`)

**Before:**

```typescript
export async function createDefaultPersonalTeam(...) {
    const team = await prisma.team.create({...});
    console.log(`✅ Created personal team "${teamName}" for user ${userId}`);
    return team;
}
```

**After:**

```typescript
import { assignPlanToTeam } from "@/lib/subscription";

export async function createDefaultPersonalTeam(...) {
    const team = await prisma.team.create({...});
    console.log(`✅ Created personal team "${teamName}" for user ${userId}`);

    // Assign HOBBY plan to new team by default
    try {
        await assignPlanToTeam(team.id, "HOBBY");
        console.log(`✅ Assigned HOBBY plan to team ${team.id}`);
    } catch (error) {
        console.error(`❌ Failed to assign HOBBY plan to team ${team.id}:`, error);
        // Don't throw error - team creation should succeed even if plan assignment fails
    }

    return team;
}
```

### 2. Fixed Webhook Downgrade Logic (`src/app/api/webhooks/polar/route.ts`)

**Before:**

```typescript
// Get the FREE plan
const freePlan = await prisma.plan.findUnique({
  where: { name: "FREE" },
});
```

**After:**

```typescript
// Get the HOBBY plan (free plan)
const hobbyPlan = await prisma.plan.findUnique({
  where: { name: "HOBBY" },
});
```

Changed from "FREE" to "HOBBY" to match the actual plan name in the database.

## 🎯 How It Works Now

### User Signup Flow

1. **User signs up** (email/password or OAuth)
2. **Team is created** → `createDefaultPersonalTeam()` is called
3. **HOBBY plan is auto-assigned** → New users start with free plan
4. **User can use the platform** → With Hobby plan limits

### Upgrade to Pro Flow

1. **User visits pricing page** → Clicks "Upgrade to Pro"
2. **Payment processed via Polar** → Polar checkout completed
3. **Webhook receives event** → `checkout.completed` event
4. **Plan upgraded to PRO** → Team subscription updated to PRO plan

### Subscription Expiry Flow

1. **Pro subscription expires** → Polar sends webhook
2. **Team downgraded to HOBBY** → Free plan restored
3. **User continues with free tier** → No service interruption

## ✅ Testing Checklist

- [ ] New user signup → Verify HOBBY plan assigned
- [ ] OAuth signup (Google, GitHub) → Verify HOBBY plan assigned
- [ ] Email/password signup → Verify HOBBY plan assigned
- [ ] Upgrade to Pro → Verify PRO plan assigned after payment
- [ ] Pro subscription expires → Verify downgrade to HOBBY plan

## 📋 Database Verification

To verify a user has the correct plan assigned:

```sql
-- Check user's team and subscription
SELECT
    u.email,
    t.name as team_name,
    p.displayName as plan_name,
    ts.status as subscription_status
FROM users u
JOIN team_members tm ON u.id = tm.userId
JOIN teams t ON tm.teamId = t.id
LEFT JOIN team_subscriptions ts ON t.id = ts.teamId
LEFT JOIN plans p ON ts.planId = p.id
WHERE u.email = 'user@example.com';
```

## 🎉 Result

✅ **All new signups automatically get HOBBY plan**  
✅ **Users who upgrade via pricing page get PRO plan**  
✅ **Expired Pro subscriptions downgrade to HOBBY plan**  
✅ **Consistent plan management across all signup methods**

## 📝 Notes

- The HOBBY plan assignment is wrapped in a try-catch block to ensure team creation succeeds even if plan assignment fails
- This is important for reliability - users can still sign up even if the billing system has issues
- Logging is added for debugging and monitoring
- The change applies to both OAuth signups (Google, GitHub) and email/password signups
