# Credit-Based Pricing Model

This document describes Craft's new credit-based pricing model, inspired by successful platforms like Lovable and GitHub Copilot.

## Overview

We've moved from a token-based model to a simpler, more user-friendly credit system. This makes pricing more predictable and easier to understand for users.

## Pricing Tiers

### Free Plan - $0/month

- **20 credits per month**
- **Max 5 credits per day** (to prevent abuse)
- Up to 3 projects
- AI-powered app building
- Deploy to Vercel
- Figma import & GitHub sync
- 0.5GB database storage
- Community support
- **No credit rollover**

**Ideal for:** Hobbyists, students, and those trying out Craft

---

### Pro Plan - $25/month (₹2,075/month)

- **100 credits per month**
- **No daily limits** - use your credits freely
- **Credit rollover** - unused credits carry over
- Unlimited projects
- Custom domains
- Private projects
- Remove Craft branding
- 5GB database storage
- Priority support

**Ideal for:** Individual developers, freelancers, and small teams

---

### Business Plan - $50/month (₹4,150/month)

- **100 credits per month** (same as Pro)
- **No daily limits** - use your credits freely
- **Credit rollover**
- All Pro features, plus:
- SSO authentication
- Opt out of data training
- 20GB database storage (4x more than Pro)
- Priority support
- Advanced team features

**Ideal for:** Growing teams and departments needing advanced security and compliance

---

### Enterprise Plan - Custom Pricing

- **Custom credit allocation**
- Unlimited credits available
- All Business features, plus:
- Dedicated support team
- Onboarding services
- Custom integrations
- Group-based access control
- Custom design systems
- SLA guarantees
- Unlimited database storage
- Advanced analytics

**Ideal for:** Large organizations with specific needs

## What is a Credit?

A credit represents a unit of AI interaction with Craft. Different operations consume different amounts of credits:

- **Simple queries/chats**: 1-2 credits
- **Component generation**: 3-5 credits
- **Full page generation**: 10-20 credits
- **Complex app creation**: 20-50 credits
- **Refactoring/modifications**: 5-15 credits

The exact credit cost depends on:

- Complexity of the request
- Amount of code generated
- Number of files modified
- Context size needed

## Credit Rollover

**Pro and Business plans** feature credit rollover:

- Unused monthly credits carry over to the next month
- Example: If you use only 50 of your 100 monthly credits, the remaining 50 will be available next month

**Free plan** does not have credit rollover and has a daily limit of 5 credits to prevent abuse.

## Daily Credit Limits

**Free Plan:**

- 5 credits per day maximum
- This prevents abuse while still allowing meaningful experimentation
- Total: 20 credits/month (you can use them at 5 credits/day pace)

**Pro Plan:**

- **No daily limits!** Use your 100 credits whenever you need them
- Flexibility to use all credits in one day or spread them out
- Credits roll over month-to-month

**Business Plan:**

- **No daily limits!** Use your 100 credits whenever you need them
- Same credits as Pro, but with advanced security and compliance features
- Credits roll over month-to-month

**Enterprise Plan:**

- Custom allocation, no limits

## Comparison with Other Platforms

### GitHub Copilot

- **Free**: 50 chat requests/month, 2,000 completions
- **Pro ($10/month)**: Unlimited chats and completions
- **Pro+ ($39/month)**: Premium models access

### Lovable

- **Pro ($25/month)**: 100 monthly credits + 5 daily credits
- **Business ($50/month)**: 100 monthly credits + advanced features

### Craft (Our Model)

- **Free ($0)**: 20 credits/month (5/day max)
- **Pro ($25/month)**: 100 credits, no daily limits - matches Lovable pricing
- **Business ($50/month)**: 100 credits, no daily limits + SSO & compliance - matches Lovable pricing

**Key Advantage:** Our Pro and Business plans have NO daily limits (unlike Lovable's daily credit system), giving you complete flexibility!

## Advantages of Credit-Based Pricing

1. **Predictable**: Users know exactly what they're getting
2. **No daily limits on paid plans**: Use your credits when you need them
3. **Fair free tier**: Daily limits prevent abuse while allowing real usage
4. **Flexible**: Different operations cost different credits based on complexity
5. **Fair**: Heavy users pay more, light users pay less
6. **Simple**: No need to understand tokens, models, or technical details
7. **Rollover**: Pro/Business users never lose what they paid for
8. **Transparent**: Clear credit costs for different operations

## Migration from Token-Based Pricing

### Old Model (Deprecated)

- **Free**: Pay-as-you-go at $20/1M tokens
- **Premium**: $500/month, 1M tokens/day
- **Enterprise**: Custom

### New Model (Current)

- **Free**: 20 credits/month (5/day max)
- **Pro**: $25/month, 100 credits (no daily limits)
- **Business**: $50/month, 100 credits (no daily limits) + advanced features
- **Enterprise**: Custom

### Why We Changed

1. **Tokens are confusing** - Most users don't understand what a token is
2. **Too expensive** - $500/month Premium plan was prohibitive for most users
3. **Industry alignment** - $25 and $50 price points match Lovable
4. **Simpler differentiation** - Business gets same credits but with SSO, compliance, and security features
5. **Industry standard** - Credits are more common and understood
6. **Better UX** - Simpler mental model for users
7. **Competitive pricing** - $20/month is more accessible than $500/month
8. **No daily restrictions on paid plans** - Users have full flexibility

## Implementation Details

### Constants Location

- `src/lib/pricing-constants.ts` - Contains all pricing tiers and features

### Key Functions

```typescript
// Get monthly credits for a plan
getMonthlyCredits(planName: PlanName): number | null

// Get daily credit limit (only for Free plan)
getDailyCreditLimit(planName: PlanName): number | null

// Check if plan has daily credit limits
hasDailyCreditLimit(planName: PlanName): boolean
```

### Payment Integration

- Razorpay handles payments in `src/lib/razorpay.ts`
- Payment routes: `src/app/api/payment/create-order/route.ts` and `verify/route.ts`
- Supports both USD and INR currencies

## Next Steps

1. **Implement credit tracking** - Track credit usage per user
2. **Credit consumption logic** - Calculate credits per operation
3. **Usage dashboard** - Show users their credit balance
4. **Credit purchase** - Allow buying additional credits
5. **Analytics** - Track which features consume most credits
6. **Notifications** - Alert users when running low on credits

## Pricing Page

The pricing page (`src/app/pricing/page.tsx`) displays:

- All four pricing tiers
- Currency toggle (USD/INR)
- Auto-detection of user location
- Feature comparison
- FAQ section focused on credits
- Clear CTA buttons for each tier

## References

- [Lovable Pricing](https://lovable.dev/pricing)
- [GitHub Copilot Pricing](https://github.com/features/copilot/plans)
- Design System: `docs/design-system.md`
