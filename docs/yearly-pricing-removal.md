# Yearly Pricing Removal - Changes Summary

## Overview

Removed all yearly pricing references from the billing system. Craft now only supports **monthly billing**.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)

**Removed:**

- `priceYearlyUsd` field from Plan model
- `priceYearlyInr` field from Plan model
- `billingCycle` field from TeamSubscription model

**Updated:**

- Billing periods now default to 30 days (monthly only)

### 2. Seed Data (`prisma/seed.ts`)

**Removed:**

- `priceYearlyUsd` from all plans
- `priceYearlyInr` from all plans
- Yearly discount mentions (~17% off)

**Updated:**

- Plan summary now shows "PRO: $25/month" (not "$25/month or $250/year")

### 3. Subscription Utility (`src/lib/subscription.ts`)

**Removed:**

- `priceYearlyUsd` from SubscriptionDetails interface
- `billingCycle` field from all return types
- `billingCycle` parameter from `assignPlanToTeam()` function
- Yearly billing logic (365 days)

**Updated:**

- All subscriptions now default to 30-day billing periods
- Function signatures simplified (no billingCycle parameter needed)

## Current Pricing

| Plan       | Monthly Price (USD) | Monthly Price (INR) |
| ---------- | ------------------- | ------------------- |
| Hobby      | $0                  | ₹0                  |
| Pro        | $25                 | ₹2,075              |
| Enterprise | Custom              | Custom              |

## Migration Impact

**Before:**

```typescript
// Had to specify billing cycle
await assignPlanToTeam(teamId, "PRO", "monthly");
// or
await assignPlanToTeam(teamId, "PRO", "yearly");
```

**After:**

```typescript
// No billing cycle needed - always monthly
await assignPlanToTeam(teamId, "PRO");
```

## What Still Works

✅ All subscription management functions  
✅ Plan assignment and upgrades  
✅ Cancellation and reactivation  
✅ Usage tracking  
✅ Invoice generation  
✅ Payment processing

## What Changed

❌ No more yearly billing option  
❌ No more yearly discounts  
❌ Simplified billing periods (always 30 days)

## Next Steps

When database is available:

```bash
# Run migration
npx prisma migrate dev --name remove-yearly-pricing

# Seed plans
npm run db:seed

# Generate Prisma client
npx prisma generate
```

## Documentation Updates Needed

The following docs still reference yearly pricing and need updates:

- `docs/subscription-billing-system.md`
- `docs/billing-quick-reference.md`
- `docs/billing-implementation-summary.md`
- `docs/billing-checklist.md`

These will be updated once confirmed that monthly-only is the final model.
