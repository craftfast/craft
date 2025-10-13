# Pricing Simplification - Usage-Based Model

**Date:** October 13, 2025  
**Status:** Completed

## Overview

Simplified the pricing model from a credit-based system to a pure usage-based model. This removes the complexity of credit allocations, tiers, and rollovers, making pricing more transparent and easier to understand.

## What Changed

### Removed

- ❌ Credit-based pricing (100 credits/month, etc.)
- ❌ Credit selectors and tiers (100, 200, 500, 1000, etc.)
- ❌ Credit rollover features
- ❌ Daily credit limits
- ❌ Price per credit calculations
- ❌ CreditSelector component usage

### Updated to Usage-Based Model

#### Hobby Plan (Free)

- **Price:** $0
- **Features:**
  - Pay-as-you-go AI usage
  - Access to multiple AI models (Claude, GPT-4, Grok, etc.)
  - AI-powered code generation
  - Live preview environment
  - Up to 3 projects
  - One-click Vercel deployment
  - Figma import & GitHub integration
  - 500MB database storage
  - Community support

#### Pro Plan

- **Price:** $25/month or $250/year (~17% discount)
- **Features:**
  - Everything in Hobby, plus:
  - Usage-based AI pricing
  - Access to premium AI models
  - No daily usage limits
  - Unlimited projects
  - Custom domain support
  - Private repositories
  - Priority AI processing
  - Advanced code generation
  - Remove Craft branding
  - 5GB database storage
  - Email support

#### Enterprise Plan

- **Price:** Custom
- **Features:**
  - Everything in Pro, plus:
  - Custom AI usage allocations
  - Dedicated AI model instances
  - SSO & SAML authentication
  - Team collaboration tools
  - Advanced security controls
  - Audit logs & compliance
  - Opt-out of AI training
  - 99.9% uptime SLA
  - Dedicated account manager
  - 24/7 priority support
  - Onboarding & training
  - Custom integrations
  - Unlimited database storage

## Files Modified

### 1. `src/app/pricing/page.tsx`

- Removed `CreditSelector` import
- Removed credit calculation functions (`calculateTierPrice`, `getTierDisplayPrice`)
- Removed `proCredits` state
- Simplified Pro plan payment handler
- Removed `showCreditSelector` property from pricing plans
- Updated all plan features to reflect usage-based model
- Updated FAQ section:
  - Changed "What is a credit?" to "How does usage-based pricing work?"
  - Changed "Do unused credits roll over?" to "What's included in the monthly fee?"

### 2. `src/lib/pricing-constants.ts`

- Removed all credit-related properties from plan definitions:
  - `creditsPerMonth`
  - `baseCredits`
  - `basePriceMonthly`
  - `basePriceYearly`
  - `pricePerCreditMonthly`
  - `pricePerCreditYearly`
  - `minCredits`
  - `maxCredits`
  - `dailyCreditLimit`
  - `creditRollover`
- Removed utility functions:
  - `getMonthlyCredits()`
  - `getDailyCreditLimit()`
  - `hasDailyCreditLimit()`
  - `calculateTierPrice()`
  - `getTierDisplayPrice()`
  - `getCreditTiers()`
  - `isValidCreditAmount()`
- Kept core pricing structure and remaining utility functions:
  - `getPlanPrice()`
  - `getDisplayPrice()`
  - `hasFeatureAccess()`

### 3. `src/components/CreditSelector.tsx`

- ⚠️ **Note:** This component still exists but is no longer used in the pricing page
- Can be removed in a future cleanup if not needed elsewhere

## Benefits of Usage-Based Pricing

1. **Simplicity:** Users only pay for what they use
2. **Transparency:** No confusion about credit values or calculations
3. **Flexibility:** AI usage scales naturally with actual consumption
4. **Reduced Complexity:** No need to manage credit tiers, rollovers, or limits
5. **Better UX:** Simpler pricing page without complex selectors
6. **Easier Billing:** Straightforward monthly/yearly subscription + usage charges

## Implementation Notes

- No database schema changes required (no credit fields existed)
- All TypeScript errors resolved
- Pricing page renders correctly with simplified structure
- Pro plan fixed price: $25/month or $250/year
- AI usage will be billed separately based on consumption

## Testing Checklist

- [x] Pricing page loads without errors
- [x] All three pricing tiers display correctly
- [x] Monthly/Yearly toggle works
- [x] FAQ section reflects usage-based model
- [ ] Payment flow works for Pro plan
- [ ] Usage-based AI billing tracking (to be implemented)

## Future Considerations

1. **Usage Tracking:** Implement AI usage tracking and billing
2. **Usage Dashboard:** Show users their AI consumption and costs
3. **Usage Limits:** Add optional usage caps for Pro tier
4. **Component Cleanup:** Remove `CreditSelector.tsx` if not needed elsewhere
5. **Documentation:** Update user-facing documentation to reflect new pricing model
