# Pricing Update Summary - October 6, 2025

## Final Pricing Structure

### Pricing Tiers

| Plan           | Price (USD) | Price (INR) | Credits/Month | Daily Limit | Rollover |
| -------------- | ----------- | ----------- | ------------- | ----------- | -------- |
| **Free**       | $0          | ₹0          | 20            | 5/day       | ❌ No    |
| **Pro**        | $25         | ₹2,075      | 100           | ✅ None     | ✅ Yes   |
| **Business**   | $50         | ₹4,150      | 100           | ✅ None     | ✅ Yes   |
| **Enterprise** | Custom      | Custom      | Custom        | ✅ None     | ✅ Yes   |

### Key Changes from Previous Version

1. **Pro Plan**: $20 → **$25** (matches Lovable)
2. **Business Plan**: $40 → **$50** (matches Lovable)
3. **Business Credits**: 200 → **100** (same as Pro)

### Why Business Costs More with Same Credits?

The Business plan is differentiated by **advanced features**, not credit quantity:

**Pro Plan ($25/month) - 100 credits:**

- ✅ Unlimited projects
- ✅ Custom domains
- ✅ Private projects
- ✅ Remove branding
- ✅ 5GB database storage
- ✅ Priority support
- ✅ No daily limits
- ✅ Credit rollover

**Business Plan ($50/month) - 100 credits:**

- ✅ **Everything in Pro, PLUS:**
- ✅ **SSO authentication** (enterprise login)
- ✅ **Opt out of data training** (compliance)
- ✅ **20GB database storage** (4x more)
- ✅ **Advanced team features**
- ✅ **Better compliance & security**

## Comparison with Lovable

| Feature              | Lovable Pro    | Craft Pro | Lovable Business | Craft Business |
| -------------------- | -------------- | --------- | ---------------- | -------------- |
| **Price**            | $25/month      | $25/month | $50/month        | $50/month      |
| **Monthly Credits**  | 100            | 100       | 100              | 100            |
| **Daily Credits**    | 5 (max 150/mo) | ❌ None   | Unspecified      | ❌ None        |
| **Daily Limits**     | ✅ Yes         | ❌ No     | ✅ Yes           | ❌ No          |
| **Rollover**         | ✅ Yes         | ✅ Yes    | ✅ Yes           | ✅ Yes         |
| **SSO**              | ❌ No          | ❌ No     | ✅ Yes           | ✅ Yes         |
| **Training Opt-out** | ❌ No          | ❌ No     | ✅ Yes           | ✅ Yes         |

### Craft's Competitive Advantage

1. **No Daily Limits on Paid Plans**: Unlike Lovable's daily credit system, you can use all 100 credits whenever you need them
2. **True Flexibility**: Use 100 credits in one day for a big project, or spread them across the month
3. **Simpler Model**: No complex daily + monthly credit calculations
4. **Better Value**: Same price as Lovable but more freedom

## Value Proposition

### Free Plan

- **Best for**: Learning, personal projects, evaluation
- **Limitation**: 5 credits/day prevents abuse while allowing real usage
- **Perfect for**: Students, hobbyists, trying before buying

### Pro Plan ($25/month)

- **Best for**: Individual developers, freelancers, small teams
- **Sweet spot**: Most users will find 100 credits/month sufficient
- **Key benefit**: Complete flexibility with no daily restrictions

### Business Plan ($50/month)

- **Best for**: Companies needing compliance and security
- **Value add**: SSO, training opt-out, 4x storage
- **Target**: Teams with security requirements, regulated industries

### Enterprise Plan (Custom)

- **Best for**: Large organizations
- **Customizable**: Credits, features, SLAs
- **White glove**: Dedicated support, onboarding

## Credit Usage Guidelines

Based on typical operations:

| Operation          | Est. Credits | Example                           |
| ------------------ | ------------ | --------------------------------- |
| Simple chat        | 1-2          | "How do I style this button?"     |
| Component creation | 3-5          | "Create a contact form"           |
| Full page          | 10-20        | "Build a landing page"            |
| Complex app        | 20-50        | "Create a todo app with database" |
| Modifications      | 5-15         | "Add authentication to this app"  |

### 100 Credits Can Get You:

- ~50 simple interactions
- ~20 component creations
- ~5-10 full pages
- ~2-5 complete apps
- Mix and match based on your needs!

## Pricing Strategy Rationale

### Why Match Lovable's Pricing?

1. **Market validation**: Lovable's pricing is proven and accepted
2. **No price competition**: Focus on features and UX, not undercutting
3. **Value perception**: Premium pricing signals quality
4. **Better margins**: Room for sustainable growth

### Why Same Credits for Pro & Business?

1. **Simpler to understand**: Credit quantity isn't the differentiator
2. **Feature-based upsell**: Business customers pay for SSO, compliance, security
3. **Common pattern**: Many SaaS products use this model (Slack, GitHub, etc.)
4. **Clear value**: Compliance features are worth 2x for companies that need them

### Why No Daily Limits on Paid Plans?

1. **Better UX**: Users don't like artificial restrictions
2. **Competitive advantage**: Lovable has daily limits, we don't
3. **Real flexibility**: Some days need more, some need less
4. **Trust**: Shows we trust our customers

## Next Steps

### Implementation Completed ✅

- [x] Updated `pricing-constants.ts` with new prices
- [x] Updated pricing page UI
- [x] Updated Razorpay payment integration
- [x] Updated documentation
- [x] All TypeScript errors resolved

### Still Needed 🔄

- [ ] Implement actual credit tracking system
- [ ] Build credit consumption logic (calculate credits per operation)
- [ ] Create user dashboard showing credit balance
- [ ] Add credit purchase option (top-up credits)
- [ ] Implement daily limit enforcement for Free tier
- [ ] Add low-credit notifications
- [ ] Build usage analytics dashboard
- [ ] Create credit history/transaction log

### Future Enhancements 💡

- [ ] Add-on credit packs (e.g., 100 credits for $10)
- [ ] Team credit pooling for Business plan
- [ ] Annual billing discount (save 20%)
- [ ] Usage-based pricing tier (pay per credit)
- [ ] Volume discounts for Enterprise

## Files Modified

1. `src/lib/pricing-constants.ts` - Core pricing data
2. `src/app/pricing/page.tsx` - Pricing page UI
3. `src/lib/razorpay.ts` - Payment integration
4. `docs/credit-based-pricing.md` - Documentation
5. `docs/pricing-update-summary.md` - This summary

## Testing Checklist

- [ ] Verify pricing page displays correctly
- [ ] Test Pro plan payment flow
- [ ] Test Business plan payment flow
- [ ] Verify currency conversion (USD ↔ INR)
- [ ] Check mobile responsiveness
- [ ] Validate all links and CTAs
- [ ] Test dark mode display
- [ ] Verify FAQ content accuracy

## Marketing Messaging

### Tagline

"Start for free. Upgrade to get the capacity that exactly matches your needs."

### Key Messages

- ✅ "No daily limits on paid plans - use your credits freely"
- ✅ "Credits roll over - never lose what you paid for"
- ✅ "Same great price as Lovable, more flexibility"
- ✅ "Free tier perfect for learning and trying"

### Positioning

- **vs GitHub Copilot**: More affordable ($25 vs $39), clearer pricing
- **vs Lovable**: Same price, NO daily limits (key differentiator)
- **vs Cursor**: Credit-based pricing vs unlimited (better for occasional users)

---

**Date**: October 6, 2025
**Version**: 2.0
**Status**: ✅ Complete
