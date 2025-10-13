# Subscription & Billing System

## Overview

Craft uses a usage-based pricing model with team-based subscriptions. Each team has one subscription linked to a plan, and all usage is tracked and billed per billing cycle.

## Architecture

### Database Models

#### 1. **Plan**

Defines available subscription plans (Hobby, Pro, Enterprise).

```typescript
{
  name: "HOBBY" | "PRO" | "ENTERPRISE"
  displayName: string
  priceMonthlyUsd: number
  priceYearlyUsd: number
  priceMonthlyInr: number
  priceYearlyInr: number
  maxProjects: number | null  // null = unlimited
  databaseSizeGb: number
  storageSizeGb: number
  features: string[]
}
```

#### 2. **TeamSubscription**

Links a team to a plan with billing cycle information.

```typescript
{
  teamId: string;
  planId: string;
  status: "active" | "cancelled" | "expired" | "past_due";
  billingCycle: "monthly" | "yearly";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}
```

**Key Points:**

- One subscription per team (unique constraint)
- Default plan is HOBBY (free)
- Automatically assigned when team is created

#### 3. **AITokenUsage**

Tracks every AI model API call with token counts and costs.

```typescript
{
  teamId: string
  userId: string
  projectId: string
  model: string  // "claude-sonnet-4.5", "gpt-5", etc.
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number  // Auto-calculated based on model pricing
  endpoint?: string  // "chat", "code-generation", etc.
}
```

#### 4. **UsageRecord**

Aggregated usage for each billing period.

```typescript
{
  teamId: string;
  subscriptionId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;

  // AI Usage
  aiTokensUsed: number;
  aiCostUsd: number;

  // Infrastructure Usage
  databaseSizeGb: number;
  databaseCostUsd: number;
  storageSizeGb: number;
  storageCostUsd: number;
  bandwidthGb: number;
  bandwidthCostUsd: number;
  authMau: number; // Monthly Active Users
  authCostUsd: number;
  edgeFunctionInvocations: number;
  edgeFunctionCostUsd: number;

  // Total
  totalCostUsd: number;
}
```

#### 5. **Invoice**

Generated at the end of each billing period.

```typescript
{
  teamId: string
  subscriptionId: string
  invoiceNumber: string  // "INV-2025-001"
  status: "draft" | "issued" | "paid" | "failed" | "refunded"
  billingPeriodStart: Date
  billingPeriodEnd: Date

  // Line Items
  subscriptionFeeUsd: number  // Base plan fee
  aiUsageCostUsd: number
  databaseCostUsd: number
  storageCostUsd: number
  bandwidthCostUsd: number
  authCostUsd: number
  edgeFunctionCostUsd: number

  // Totals
  subtotalUsd: number
  taxUsd: number
  totalUsd: number
  currency: "USD" | "INR"

  // Payment
  razorpayOrderId?: string
  razorpayPaymentId?: string
  paidAt?: Date
  dueDate?: Date
}
```

#### 6. **PaymentTransaction**

Records all payment attempts and their status.

```typescript
{
  teamId: string
  invoiceId?: string
  amount: number
  currency: "USD" | "INR"
  status: "pending" | "completed" | "failed" | "refunded"
  paymentMethod: "razorpay" | "stripe"
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  failureReason?: string
}
```

## Pricing Structure

### Plans

| Plan       | Monthly (USD) | Yearly (USD) | Monthly (INR) | Yearly (INR) |
| ---------- | ------------- | ------------ | ------------- | ------------ |
| Hobby      | $0            | $0           | ₹0            | ₹0           |
| Pro        | $25           | $250 (~17%)  | ₹2,075        | ₹20,750      |
| Enterprise | Custom        | Custom       | Custom        | Custom       |

### Free Tiers (Included in Base Price)

| Resource                  | Hobby   | Pro       | Enterprise |
| ------------------------- | ------- | --------- | ---------- |
| Database Storage          | 500 MB  | 5 GB      | Unlimited  |
| File Storage              | 1 GB    | 10 GB     | Unlimited  |
| Bandwidth                 | 100 GB  | 500 GB    | Unlimited  |
| Auth (MAU)                | 1,000   | 10,000    | Unlimited  |
| Edge Function Invocations | 100,000 | 1,000,000 | Unlimited  |
| Projects                  | 20      | Unlimited | Unlimited  |

### Usage-Based Pricing (Beyond Free Tier)

**Note:** Hobby plan has **hard limits** - cannot exceed free tier. Pro and Enterprise are **billed for overages**.

| Resource                  | Hobby         | Pro                  | Enterprise         |
| ------------------------- | ------------- | -------------------- | ------------------ |
| Database Storage          | Hard limit    | $0.25/GB/month       | Custom pricing     |
| File Storage              | Hard limit    | $0.04/GB/month       | Custom pricing     |
| Bandwidth                 | Hard limit    | $0.12/GB             | Custom pricing     |
| Auth (MAU)                | Hard limit    | $0.008/user          | Custom pricing     |
| Edge Function Invocations | Hard limit    | $0.50/1M invocations | Custom pricing     |
| AI Tokens                 | Pay-as-you-go | Pay-as-you-go        | Custom allocations |

### AI Model Pricing (Per 1M Tokens)

| Model             | Input  | Output | Hobby | Pro | Enterprise |
| ----------------- | ------ | ------ | ----- | --- | ---------- |
| Grok Code Fast 1  | $0.20  | $0.60  | ✅    | ✅  | ✅         |
| GPT-5 Mini        | $0.30  | $1.20  | ✅    | ✅  | ✅         |
| Gemini 2.5 Flash  | $0.50  | $1.50  | ✅    | ✅  | ✅         |
| Claude Sonnet 3.5 | $3.00  | $15.00 | ✅    | ✅  | ✅         |
| GPT-5             | $10.00 | $30.00 | ❌    | ✅  | ✅         |
| GPT-5 Codex       | $5.00  | $15.00 | ❌    | ✅  | ✅         |
| Claude Sonnet 4.5 | $3.00  | $15.00 | ❌    | ✅  | ✅         |
| Gemini 2.5 Pro    | $7.00  | $21.00 | ❌    | ✅  | ✅         |
| Claude Opus 4     | $15.00 | $75.00 | ❌    | ❌  | ✅         |

## Usage Flow

### 1. Team Creation

When a team is created:

```typescript
// Automatically assign default Hobby plan
await assignPlanToTeam(teamId, "HOBBY", "monthly");
```

### 2. AI Usage Tracking

Every AI API call:

```typescript
import { trackAIUsage } from "@/lib/ai-usage";

// Track the usage
await trackAIUsage({
  teamId: "team_123",
  userId: "user_456",
  projectId: "project_789",
  model: "claude-sonnet-4.5",
  inputTokens: 1500,
  outputTokens: 2000,
  endpoint: "chat",
});
// Cost is automatically calculated and stored
```

### 3. Infrastructure Usage Updates

Periodically update infrastructure usage:

```typescript
import { updateUsageRecord } from "@/lib/usage-tracking";

// Update database size
await updateUsageRecord(teamId, {
  databaseSizeGb: 1.5,
});

// Update storage size
await updateUsageRecord(teamId, {
  storageSizeGb: 8.2,
});

// Update bandwidth
await updateUsageRecord(teamId, {
  bandwidthGb: 120.5,
});

// Update auth MAU
await updateUsageRecord(teamId, {
  authMau: 5000,
});
```

### 4. Check Usage Limits (Hobby Plan)

Before allowing actions on Hobby plan:

```typescript
import { checkUsageLimits } from "@/lib/usage-tracking";

const { exceeded, current, limit } = await checkUsageLimits(teamId, "database");

if (exceeded) {
  throw new Error(
    `Database limit exceeded (${current}GB / ${limit}GB). Upgrade to Pro to continue.`
  );
}
```

### 5. Billing Cycle

At the end of each billing period:

```typescript
// 1. Calculate total usage costs
const usageRecord = await getCurrentUsageRecord(teamId);

// 2. Generate invoice
const invoice = await createInvoice(teamId, usageRecord);

// 3. Charge customer
await processPayment(invoice);

// 4. Update subscription period
await renewSubscription(teamId);
```

## API Endpoints

### Plan Management

```typescript
// Get all plans
GET / api / plans;

// Get specific plan
GET / api / plans / [planId];
```

### Subscription Management

```typescript
// Get team subscription
GET /api/teams/[teamId]/subscription

// Upgrade plan
POST /api/teams/[teamId]/subscription/upgrade
{
  planName: "PRO",
  billingCycle: "monthly" | "yearly"
}

// Cancel subscription
POST /api/teams/[teamId]/subscription/cancel

// Reactivate subscription
POST /api/teams/[teamId]/subscription/reactivate
```

### Usage Tracking

```typescript
// Get current usage
GET / api / teams / [teamId] / usage;

// Get usage history
GET / api / teams / [teamId] / usage / history;

// Get AI usage breakdown
GET / api / teams / [teamId] / usage / ai;
```

### Invoices

```typescript
// Get team invoices
GET / api / teams / [teamId] / invoices;

// Get specific invoice
GET / api / invoices / [invoiceId];

// Download invoice PDF
GET / api / invoices / [invoiceId] / pdf;
```

### Payment

```typescript
// Create payment order
POST /api/payment/create-order
{
  teamId: string,
  invoiceId?: string,
  amount: number,
  currency: "USD" | "INR"
}

// Verify payment
POST /api/payment/verify
{
  orderId: string,
  paymentId: string,
  signature: string
}
```

## Implementation Checklist

### Database

- [x] Create Plan model
- [x] Create TeamSubscription model
- [x] Create AITokenUsage model
- [x] Create UsageRecord model
- [x] Create Invoice model
- [x] Create PaymentTransaction model
- [x] Add subscription relation to Team model
- [ ] Run migration
- [ ] Seed plans

### Utilities

- [x] `src/lib/subscription.ts` - Subscription management
- [x] `src/lib/ai-usage.ts` - AI token tracking
- [x] `src/lib/usage-tracking.ts` - Infrastructure usage
- [ ] `src/lib/billing.ts` - Invoice generation
- [ ] `src/lib/payment.ts` - Payment processing

### API Routes

- [ ] `/api/plans/*` - Plan endpoints
- [ ] `/api/teams/[teamId]/subscription/*` - Subscription management
- [ ] `/api/teams/[teamId]/usage/*` - Usage tracking
- [ ] `/api/invoices/*` - Invoice management
- [ ] `/api/payment/*` - Payment processing

### Team Creation Hook

- [ ] Auto-assign Hobby plan when team is created
- [ ] Create initial usage record

### AI Integration

- [ ] Track token usage on every AI call
- [ ] Check model availability based on plan
- [ ] Enforce Hobby plan limits

### Billing Cron Jobs

- [ ] Daily: Update infrastructure usage metrics
- [ ] Daily: Check for expiring subscriptions
- [ ] End of period: Generate invoices
- [ ] End of period: Process payments
- [ ] End of period: Renew subscriptions

### UI Components

- [ ] Subscription dashboard
- [ ] Usage charts and metrics
- [ ] Upgrade/downgrade plan flow
- [ ] Invoice list and download
- [ ] Payment history

## Migration Guide

### Step 1: Run Database Migration

```bash
npx prisma migrate dev --name add-subscription-billing
```

### Step 2: Seed Plans

```bash
npm run db:seed
```

### Step 3: Migrate Existing Teams

```typescript
// Assign default Hobby plan to all existing teams
const teams = await prisma.team.findMany();
for (const team of teams) {
  await assignPlanToTeam(team.id, "HOBBY", "monthly");
}
```

### Step 4: Update Team Creation

```typescript
// In team creation logic, add:
await assignPlanToTeam(newTeam.id, "HOBBY", "monthly");
```

### Step 5: Integrate AI Tracking

```typescript
// In AI service, add after each API call:
await trackAIUsage({
  teamId,
  userId,
  projectId,
  model,
  inputTokens,
  outputTokens,
});
```

## Testing

### Test Plan Assignment

```typescript
const teamId = "test_team_123";

// Assign Hobby plan
await assignPlanToTeam(teamId, "HOBBY", "monthly");

// Verify subscription
const subscription = await getTeamSubscription(teamId);
console.log(subscription); // Should show HOBBY plan
```

### Test Usage Tracking

```typescript
// Track AI usage
await trackAIUsage({
  teamId: "test_team",
  userId: "test_user",
  projectId: "test_project",
  model: "gpt-5",
  inputTokens: 1000,
  outputTokens: 1500,
});

// Check usage
const usage = await getCurrentPeriodAIUsage("test_team");
console.log(usage); // Should show token count and cost
```

### Test Limit Checking

```typescript
// For Hobby plan
const { exceeded } = await checkUsageLimits("test_team", "database");
console.log(exceeded); // false if under 500MB
```

## Support

For questions or issues with the billing system:

- Email: billing@craft.tech
- Docs: https://docs.craft.tech/billing
- Status: https://status.craft.tech
