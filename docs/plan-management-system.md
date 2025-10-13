# Plan Management System

## Overview

The plan management system stores all subscription plan details in the database for easy reference, updates, and dynamic pricing calculations. This ensures consistency across the application and makes it easy to update pricing without code changes.

## Database Schema

### Plan Model

```prisma
model Plan {
  id                String   @id @default(cuid())
  name              String   @unique // "FREE", "PRO", "BUSINESS", "ENTERPRISE"
  displayName       String // "Free", "Pro", "Business", "Enterprise"
  description       String? // Plan description
  priceUsdPerCredit Float // Price per credit in USD (e.g., 0.25 for Pro)
  priceInrPerCredit Float // Price per credit in INR (e.g., 20.75 for Pro)
  minCredits        Int // Minimum credits (e.g., 100 for Pro)
  maxCredits        Int // Maximum credits (e.g., 10000 for Pro)
  creditIncrement   Int      @default(100) // Credit selection increment
  dailyLimit        Int? // Daily generation limit (5 for Free, null for paid plans)
  features          Json // JSON array of plan features
  isActive          Boolean  @default(true) // Whether this plan is currently available
  sortOrder         Int      @default(0) // Display order (0 = Free, 1 = Pro, etc.)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

## Current Plans

### Free Plan

- **Credits**: 20 (fixed)
- **Daily Limit**: 5 generations
- **Price**: $0
- **Features**: Basic AI development, community support

### Pro Plan

- **Credits**: 100-10,000 (customizable in 100-credit increments)
- **Daily Limit**: Unlimited
- **Price**: $0.25/credit (USD), ₹20.75/credit (INR)
- **Minimum Price**: $25 (100 credits)
- **Features**: Advanced AI models, priority support, team collaboration, 5GB database

### Business Plan

- **Credits**: 100-10,000 (customizable in 100-credit increments)
- **Daily Limit**: Unlimited
- **Price**: $0.50/credit (USD), ₹41.50/credit (INR)
- **Minimum Price**: $50 (100 credits)
- **Features**: All Pro features + SSO, data opt-out, 20GB database, priority business support

### Enterprise Plan

- **Credits**: Custom (10,000+)
- **Daily Limit**: Unlimited
- **Price**: Custom pricing
- **Features**: All Business features + SLA, on-premise, dedicated support, custom integrations

## Setup Instructions

### 1. Run Migration

```bash
npx prisma migrate dev --name add_plan_model
```

### 2. Seed Database

```bash
npm run db:seed
```

This will populate the `plans` table with all plan data.

### 3. Verify Data

You can verify the plans were created successfully:

```bash
npx prisma studio
```

Navigate to the "plans" table to see all plan details.

## Usage

### Import the Plan Utility

```typescript
import {
  getAllPlans,
  getPlanByName,
  calculatePlanPrice,
  getPlanPriceInSmallestUnit,
  isValidCreditAmount,
  getPlanCreditOptions,
  getRecommendedCreditOptions,
  comparePlans,
} from "@/lib/plans";
```

### Get All Plans

```typescript
const plans = await getAllPlans();
// Returns all active plans ordered by sortOrder
```

### Get Specific Plan

```typescript
const proPlan = await getPlanByName("PRO");
console.log(proPlan.displayName); // "Pro"
console.log(proPlan.priceUsdPerCredit); // 0.25
console.log(proPlan.features); // Array of features
```

### Calculate Price

```typescript
// Calculate price for 500 credits on Pro plan
const price = await calculatePlanPrice("PRO", 500, "USD");
console.log(price); // 125 (500 * 0.25)

// Get price in smallest unit (cents) for payment processing
const priceInCents = await getPlanPriceInSmallestUnit("PRO", 500, "USD");
console.log(priceInCents); // 12500 (for Razorpay)
```

### Validate Credit Amount

```typescript
const isValid = await isValidCreditAmount("PRO", 250);
console.log(isValid); // true (100, 200, 300... are valid)

const isInvalid = await isValidCreditAmount("PRO", 125);
console.log(isInvalid); // false (not a 100-credit increment)
```

### Get Credit Options

```typescript
// Get all possible credit options for a plan
const options = await getPlanCreditOptions("PRO");
console.log(options); // [100, 200, 300, ..., 10000]

// Get recommended options with labels
const recommended = await getRecommendedCreditOptions("PRO");
console.log(recommended);
// [
//   { credits: 100, label: "Light users", recommended: false },
//   { credits: 200, label: "Regular users", recommended: true },
//   ...
// ]
```

### Compare Plans

```typescript
const comparison = await comparePlans("PRO", "BUSINESS");
console.log(comparison.priceDifference); // { usd: 25, inr: 2075 }
console.log(comparison.uniqueFeatures2); // Business-only features
```

## API Integration

### Example: Payment Processing

```typescript
import { getPlanPriceInSmallestUnit } from "@/lib/plans";
import { initiateRazorpayPayment } from "@/lib/razorpay";

async function handlePurchase(
  planName: string,
  credits: number,
  currency: "USD" | "INR"
) {
  // Get price from database
  const amount = await getPlanPriceInSmallestUnit(planName, credits, currency);

  if (!amount) {
    throw new Error("Invalid plan or credit amount");
  }

  // Initiate payment
  await initiateRazorpayPayment({
    amount,
    currency,
    name: "Craft",
    description: `${planName} Plan - ${credits} credits`,
    planName,
    onSuccess: (response) => {
      // Handle success
    },
    onFailure: (error) => {
      // Handle failure
    },
  });
}
```

### Example: Pricing Page

```typescript
import { getAllPlans } from "@/lib/plans";

export default async function PricingPage() {
  const plans = await getAllPlans();

  return (
    <div>
      {plans.map((plan) => (
        <div key={plan.id}>
          <h2>{plan.displayName}</h2>
          <p>{plan.description}</p>
          <p>
            ${plan.priceUsdPerCredit}/credit
            {plan.minCredits > 0 && (
              <span> (from ${plan.minCredits * plan.priceUsdPerCredit})</span>
            )}
          </p>
          <ul>
            {plan.features.map((feature, i) => (
              <li key={i}>{feature}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

## Updating Plans

### Update Pricing

To update plan pricing, you can use Prisma Studio or update directly:

```typescript
import { prisma } from "@/lib/db";

// Update Pro plan pricing
await prisma.plan.update({
  where: { name: "PRO" },
  data: {
    priceUsdPerCredit: 0.3, // New price
    priceInrPerCredit: 24.9,
  },
});
```

### Add New Features

```typescript
const plan = await prisma.plan.findUnique({
  where: { name: "PRO" },
});

const updatedFeatures = [
  ...(plan.features as string[]),
  "New feature: AI code reviews",
];

await prisma.plan.update({
  where: { name: "PRO" },
  data: {
    features: updatedFeatures,
  },
});
```

### Deactivate a Plan

```typescript
await prisma.plan.update({
  where: { name: "OLD_PLAN" },
  data: {
    isActive: false,
  },
});
```

## Benefits

1. **Single Source of Truth**: All plan details in one place
2. **Easy Updates**: Change pricing without code deployment
3. **Dynamic Pricing**: Calculate prices based on custom credit amounts
4. **Consistent Data**: Same plan info across pricing page, checkout, admin panel
5. **Audit Trail**: Track changes with `createdAt` and `updatedAt`
6. **Feature Management**: Easily add/remove plan features
7. **A/B Testing**: Create multiple plan variations
8. **Multi-currency**: Built-in support for USD and INR

## Migration from Hardcoded Values

The old `getPlanPrice()` function in `razorpay.ts` is now deprecated. Migrate to database-driven pricing:

**Before:**

```typescript
import { getPlanPrice } from "@/lib/razorpay";
const price = getPlanPrice("PRO", "USD"); // Always returns 25
```

**After:**

```typescript
import { calculatePlanPrice } from "@/lib/plans";
const price = await calculatePlanPrice("PRO", 500, "USD"); // Returns 125
```

## Testing

Run tests to ensure plan functions work correctly:

```typescript
// Test plan retrieval
const proPlan = await getPlanByName("PRO");
expect(proPlan?.name).toBe("PRO");

// Test price calculation
const price = await calculatePlanPrice("PRO", 100, "USD");
expect(price).toBe(25);

// Test validation
const valid = await isValidCreditAmount("PRO", 100);
expect(valid).toBe(true);
```

## Future Enhancements

- **Subscription Management**: Track user subscriptions
- **Usage Tracking**: Monitor credit usage per user
- **Plan Analytics**: Track which plans are most popular
- **Custom Plans**: Allow admins to create custom plans for specific users
- **Promo Codes**: Support discount codes and special offers
- **Regional Pricing**: Support more currencies and regional pricing
- **Plan History**: Track pricing changes over time
