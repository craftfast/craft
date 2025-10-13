# Billing System Quick Reference

## 🚀 Quick Start

### 1. After Database is Available

```bash
# Run migration
npx prisma migrate dev --name add-subscription-billing-system

# Seed plans
npm run db:seed

# Generate Prisma client
npx prisma generate
```

### 2. Team Creation Hook

```typescript
import { assignPlanToTeam } from "@/lib/subscription";

// In your team creation logic (src/lib/team.ts or similar)
const newTeam = await prisma.team.create({
  data: {
    /* ... */
  },
});

// AUTO-ASSIGN HOBBY PLAN
await assignPlanToTeam(newTeam.id, "HOBBY", "monthly");
```

### 3. Track AI Usage

```typescript
import { trackAIUsage } from "@/lib/ai-usage";

// After every AI API call
const result = await aiService.chat({
  model: "claude-sonnet-4.5",
  messages: [...],
});

// Track it
await trackAIUsage({
  teamId: currentTeam.id,
  userId: currentUser.id,
  projectId: currentProject.id,
  model: "claude-sonnet-4.5",
  inputTokens: result.usage.input_tokens,
  outputTokens: result.usage.output_tokens,
  endpoint: "chat",
});
```

### 4. Check Limits (Hobby Plan Only)

```typescript
import { checkUsageLimits } from "@/lib/usage-tracking";

// Before database operations for Hobby users
const { exceeded, current, limit } = await checkUsageLimits(teamId, "database");

if (exceeded) {
  return {
    error: "Database limit reached",
    message: `You've used ${current}GB of your ${limit}GB limit. Upgrade to Pro for more storage.`,
    upgradeUrl: "/pricing",
  };
}
```

### 5. Update Infrastructure Usage

```typescript
import { updateUsageRecord } from "@/lib/usage-tracking";

// Update periodically (e.g., via cron job or on-demand)
await updateUsageRecord(teamId, {
  databaseSizeGb: 2.5, // Get from database
  storageSizeGb: 8.3, // Get from storage service
  bandwidthGb: 150.2, // Get from CDN/logs
  authMau: 3500, // Get from auth service
  edgeFunctionInvocations: 250000, // Get from function logs
});
```

## 📊 Common Queries

### Get Team's Current Plan

```typescript
import { getTeamSubscription } from "@/lib/subscription";

const subscription = await getTeamSubscription(teamId);
console.log(subscription?.plan.displayName); // "Hobby", "Pro", or "Enterprise"
```

### Get AI Usage for Current Period

```typescript
import { getCurrentPeriodAIUsage } from "@/lib/ai-usage";

const usage = await getCurrentPeriodAIUsage(teamId);
console.log(`Tokens used: ${usage.totalTokens}`);
console.log(`Cost: $${usage.totalCostUsd.toFixed(2)}`);
console.log("By model:", usage.byModel);
```

### Get Current Usage Record

```typescript
import { getCurrentUsageRecord } from "@/lib/usage-tracking";

const record = await getCurrentUsageRecord(teamId);
console.log(`Total cost this period: $${record?.totalCostUsd}`);
console.log(`Database: ${record?.databaseSizeGb}GB`);
console.log(`Storage: ${record?.storageSizeGb}GB`);
```

### Check if Model Available

```typescript
import { canUseModel } from "@/lib/ai-usage";

const canUse = await canUseModel(teamId, "gpt-5");
if (!canUse) {
  return { error: "Upgrade to Pro to use GPT-5" };
}
```

## 🎯 Plan Limits at a Glance

| Resource                  | Hobby Limit (Hard) | Pro Free Tier | Enterprise |
| ------------------------- | ------------------ | ------------- | ---------- |
| Projects                  | 20                 | Unlimited     | Unlimited  |
| Database                  | 500 MB             | 5 GB          | Unlimited  |
| Storage                   | 1 GB               | 10 GB         | Unlimited  |
| Bandwidth                 | 100 GB/month       | 500 GB/month  | Unlimited  |
| Auth Users (MAU)          | 1,000              | 10,000        | Unlimited  |
| Edge Function Invocations | 100,000/month      | 1M/month      | Unlimited  |
| AI Models                 | 4 free models      | 9 models      | All models |

## 💰 Pricing

### Base Plan Prices

- **Hobby**: $0
- **Pro**: $25/month or $250/year
- **Enterprise**: Custom

### Overage Pricing (Pro Only)

- Database: **$0.25/GB/month**
- Storage: **$0.04/GB/month**
- Bandwidth: **$0.12/GB**
- Auth: **$0.008/user**
- Edge Functions: **$0.50/1M**

### AI Model Pricing (All Plans, Per 1M Tokens)

Hobby-accessible models:

- Grok Fast: $0.20 in / $0.60 out
- GPT-5 Mini: $0.30 / $1.20
- Gemini Flash: $0.50 / $1.50
- Claude Sonnet 3.5: $3.00 / $15.00

Pro+ models:

- GPT-5: $10.00 / $30.00
- Claude Sonnet 4.5: $3.00 / $15.00
- Gemini Pro: $7.00 / $21.00

## 🔄 Subscription Actions

### Upgrade to Pro

```typescript
import { assignPlanToTeam } from "@/lib/subscription";

await assignPlanToTeam(teamId, "PRO", "monthly");
// Or yearly: assignPlanToTeam(teamId, "PRO", "yearly");
```

### Cancel Subscription

```typescript
import { cancelSubscription } from "@/lib/subscription";

await cancelSubscription(teamId);
// Subscription continues until period end, then downgrades to Hobby
```

### Reactivate Cancelled Subscription

```typescript
import { reactivateSubscription } from "@/lib/subscription";

await reactivateSubscription(teamId);
// Removes cancellation flag
```

## 📂 File Locations

```
prisma/
  schema.prisma         # Database models (Plan, TeamSubscription, etc.)
  seed.ts               # Plan data seeding

src/lib/
  subscription.ts       # Subscription management functions
  ai-usage.ts           # AI token tracking functions
  usage-tracking.ts     # Infrastructure usage functions

docs/
  subscription-billing-system.md    # Full documentation
  billing-implementation-complete.md # Implementation summary
  billing-quick-reference.md        # This file
```

## ⚠️ Important Notes

1. **Hobby Plan = Hard Limits**: Users CANNOT exceed free tier
2. **Pro Plan = Soft Limits**: Users billed for overages
3. **One Subscription Per Team**: Not per user
4. **AI Costs Auto-Calculated**: Based on model pricing
5. **Track Every AI Call**: Required for accurate billing
6. **Update Infrastructure Regularly**: Via cron jobs

## 🐛 Troubleshooting

### Error: Property 'teamSubscription' does not exist

This is expected before migration. Run:

```bash
npx prisma migrate dev
npx prisma generate
```

### Team has no subscription

Assign default plan:

```typescript
await assignPlanToTeam(teamId, "HOBBY", "monthly");
```

### Need to migrate existing teams

```typescript
const teams = await prisma.team.findMany({
  where: { subscription: null },
});

for (const team of teams) {
  await assignPlanToTeam(team.id, "HOBBY", "monthly");
}
```

## 📚 Full Documentation

See `docs/subscription-billing-system.md` for:

- Complete API specifications
- Billing cycle workflows
- Invoice generation
- Payment processing
- Cron job setup
- UI component examples
