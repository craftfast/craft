# Subscription & Billing System Visual Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER SIGNS UP                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Create Team   │
                    └────────┬───────┘
                             │
                             ▼
                ┌────────────────────────┐
                │  Assign HOBBY Plan     │
                │  (Default, Free)       │
                └────────┬───────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │   TeamSubscription Created         │
        │   - Plan: HOBBY                    │
        │   - Status: active                 │
        │   - Billing: monthly               │
        │   - Period: 30 days                │
        └────────────────────────────────────┘
```

## Usage Tracking Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER USES AI FEATURE                          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   AI API Call        │
              │   (Claude, GPT, etc) │
              └──────────┬───────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  trackAIUsage()                   │
         │  - Record tokens (input/output)   │
         │  - Calculate cost                 │
         │  - Store in AITokenUsage table   │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  updateUsageRecord()              │
         │  - Add to current period total    │
         │  - Update aiTokensUsed            │
         │  - Update aiCostUsd               │
         └───────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────┐
│              USER USES INFRASTRUCTURE (DB, Storage)              │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Periodic Cron Job                │
         │  (Daily or on-demand)             │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  updateUsageRecord()              │
         │  - Database size: 2.5 GB          │
         │  - Storage size: 8.3 GB           │
         │  - Bandwidth: 120 GB              │
         │  - Auth MAU: 3,500                │
         │  - Calculate overage costs        │
         └───────────────────────────────────┘
```

## Hobby Plan Limit Check

```
┌──────────────────────────────────────────────────────────────────┐
│           HOBBY USER ATTEMPTS DATABASE OPERATION                 │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  checkUsageLimits(teamId, "db")   │
         └───────────────┬───────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
    ┌──────────────┐         ┌──────────────┐
    │  Under Limit │         │ Over Limit   │
    │  (< 500 MB)  │         │  (≥ 500 MB)  │
    └──────┬───────┘         └──────┬───────┘
           │                        │
           ▼                        ▼
    ┌──────────────┐         ┌──────────────┐
    │   ALLOWED    │         │   BLOCKED    │
    │   Continue   │         │  Show upgrade│
    └──────────────┘         │    prompt    │
                             └──────────────┘
```

## Pro Plan Usage Flow

```
┌──────────────────────────────────────────────────────────────────┐
│             PRO USER USES RESOURCES                              │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Track Usage                      │
         │  - Database: 8 GB                 │
         │  - Storage: 15 GB                 │
         │  - Bandwidth: 650 GB              │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Calculate Costs                  │
         │                                   │
         │  Free Tier:                       │
         │  - DB: 5 GB (free)                │
         │  - Storage: 10 GB (free)          │
         │  - Bandwidth: 500 GB (free)       │
         │                                   │
         │  Overage:                         │
         │  - DB: 3 GB × $0.25 = $0.75       │
         │  - Storage: 5 GB × $0.04 = $0.20  │
         │  - Bandwidth: 150 GB × $0.12 = $18│
         │                                   │
         │  Total Overage: $18.95            │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Add to Usage Record              │
         │  - Will be billed at period end   │
         └───────────────────────────────────┘
```

## Billing Cycle

```
┌──────────────────────────────────────────────────────────────────┐
│                    BILLING PERIOD ENDS                           │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Finalize Usage Record            │
         │  - AI tokens: 5M ($150)           │
         │  - DB overage: 3 GB ($0.75)       │
         │  - Storage overage: 5 GB ($0.20)  │
         │  - Bandwidth overage: 150 GB ($18)│
         │  - Total usage: $168.95           │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Generate Invoice                 │
         │  INV-2025-001                     │
         │                                   │
         │  Subscription Fee:      $25.00    │
         │  AI Usage:             $150.00    │
         │  Database Overage:       $0.75    │
         │  Storage Overage:        $0.20    │
         │  Bandwidth Overage:     $18.00    │
         │  ─────────────────────────────    │
         │  Subtotal:             $193.95    │
         │  Tax (if applicable):    $0.00    │
         │  ─────────────────────────────    │
         │  TOTAL:                $193.95    │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Process Payment                  │
         │  - Razorpay API                   │
         │  - Auto-charge saved card         │
         └───────────────┬───────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
    ┌──────────────┐         ┌──────────────┐
    │   SUCCESS    │         │    FAILED    │
    └──────┬───────┘         └──────┬───────┘
           │                        │
           ▼                        ▼
    ┌──────────────┐         ┌──────────────┐
    │  Mark Invoice│         │  Retry in    │
    │    as PAID   │         │   24 hours   │
    │              │         │  Mark as     │
    │  Start New   │         │  PAST_DUE    │
    │   Period     │         └──────────────┘
    └──────────────┘
```

## Plan Upgrade Flow

```
┌──────────────────────────────────────────────────────────────────┐
│              USER CLICKS "UPGRADE TO PRO"                        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Show Pricing Page                │
         │  - Monthly: $25                   │
         │  - Yearly: $250 (save 17%)        │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  User Selects Billing Cycle       │
         │  Chooses: Monthly ($25)           │
         └───────────────┬───────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Initiate Razorpay Payment        │
         │  - Amount: $25.00                 │
         │  - Create order                   │
         │  - Show payment modal             │
         └───────────────┬───────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
    ┌──────────────┐         ┌──────────────┐
    │  PAYMENT OK  │         │  CANCELLED   │
    └──────┬───────┘         └──────┬───────┘
           │                        │
           ▼                        ▼
    ┌──────────────┐         ┌──────────────┐
    │ Verify       │         │  Show error  │
    │ Signature    │         │  Stay on     │
    └──────┬───────┘         │  Hobby plan  │
           │                 └──────────────┘
           ▼
    ┌──────────────┐
    │ Update       │
    │ Subscription │
    │ - Plan: PRO  │
    │ - Status:    │
    │   active     │
    │ - Save       │
    │   payment ID │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Success!    │
    │  - Unlock    │
    │    Pro       │
    │    features  │
    │  - New       │
    │    billing   │
    │    period    │
    └──────────────┘
```

## Team-Based Subscription Model

```
┌────────────────────────────────────────────────────────────┐
│                         TEAM                               │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │          ONE Subscription (TeamSubscription)       │   │
│  │                                                    │   │
│  │  Plan: PRO                                         │   │
│  │  Billing: Monthly                                  │   │
│  │  Period: Nov 1 - Nov 30                            │   │
│  │  Status: active                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │              MULTIPLE Members                      │   │
│  │                                                    │   │
│  │  • Alice (Owner)                                   │   │
│  │  • Bob (Admin)                                     │   │
│  │  • Carol (Member)                                  │   │
│  │                                                    │   │
│  │  All members share the team's subscription plan   │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │         SHARED Usage (All tracked to team)         │   │
│  │                                                    │   │
│  │  • AI tokens used by all members                   │   │
│  │  • Database shared across all projects             │   │
│  │  • Storage shared across all projects              │   │
│  │  • One invoice per team                            │   │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

## Database Relationship Diagram

```
┌──────────────┐
│     Team     │
│──────────────│
│ id           │──┐
│ name         │  │
│ slug         │  │
│ ownerId      │  │
└──────────────┘  │
                  │ 1:1
                  │
                  ▼
        ┌──────────────────┐
        │ TeamSubscription │
        │──────────────────│
        │ id               │──┐
        │ teamId           │  │
        │ planId           │──┼──────┐
        │ status           │  │      │
        │ billingCycle     │  │      │ N:1
        │ periodStart      │  │      │
        │ periodEnd        │  │      ▼
        └──────────────────┘  │  ┌────────┐
                              │  │  Plan  │
                         1:N  │  │────────│
                              │  │ id     │
                              │  │ name   │
                              ▼  │ price  │
                   ┌──────────────┐       │
                   │ UsageRecord  │       └────────┘
                   │──────────────│
                   │ id           │
                   │ subscriptionId│
                   │ aiCostUsd    │
                   │ dbCostUsd    │
                   │ totalCostUsd │
                   └──────────────┘
                              │
                         1:N  │
                              ▼
                   ┌──────────────┐
                   │   Invoice    │
                   │──────────────│
                   │ id           │
                   │ subscriptionId│
                   │ totalUsd     │
                   │ status       │
                   └──────────────┘


        ┌──────────────────┐
        │   AITokenUsage   │
        │──────────────────│
        │ id               │
        │ teamId           │──────▶ Links to Team
        │ userId           │
        │ projectId        │
        │ model            │
        │ inputTokens      │
        │ outputTokens     │
        │ costUsd          │
        │ createdAt        │
        └──────────────────┘
```

## Summary

**Key Points:**

1. ✅ **One subscription per team** (not per user)
2. ✅ **Default Hobby plan** assigned automatically
3. ✅ **Usage tracked per team** (all members share)
4. ✅ **Hobby = Hard limits** (must upgrade to continue)
5. ✅ **Pro = Soft limits** (billed for overages)
6. ✅ **AI costs auto-calculated** per model pricing
7. ✅ **Infrastructure usage tracked** (DB, storage, bandwidth, auth)
8. ✅ **Invoices generated** at end of each billing period
9. ✅ **Razorpay integration** for payments
10. ✅ **Complete audit trail** via all tracking tables
