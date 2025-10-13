# ✅ Polar Setup - Simplified & Corrected

## What Changed

After reviewing your actual pricing page, I've corrected the documentation to match your **real pricing model**:

### Your Actual Pricing

- **Hobby (FREE)**: $0/month
- **Pro**: **$25/month per user** (monthly only, no yearly)
- **Enterprise**: Custom

**Everything beyond the base subscription is usage-based.**

## What You Need to Do (Simplified)

### 1. Create ONE Product in Polar Dashboard

Go to https://polar.sh/dashboard/products

**Product Details:**

- Name: `Craft Pro`
- Description: `Professional plan: $25/month per user with pay-as-you-go for usage`
- Type: Subscription (recurring)
- Visibility: Public

**Price Details:**

- Amount: $25.00 USD
- Period: Monthly
- Type: Per seat (per user)

**Copy the Price ID** you get after creating this!

### 2. Update Environment Variables

Add to your `.env`:

```bash
POLAR_PRO_PRICE_ID=your_price_id_here
POLAR_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. That's It!

Your code is already updated to work with this:

- ✅ `src/app/api/payment/create-checkout/route.ts` - Updated to use `POLAR_PRO_PRICE_ID`
- ✅ `src/app/api/webhooks/polar/route.ts` - Webhook handler already created
- ✅ `.env.example` - Updated with simplified variables
- ✅ Pricing page already configured correctly

## Documentation

### Primary Guide

📄 **`docs/POLAR-SETUP-SIMPLIFIED.md`** - Start here!

- Reflects your actual pricing model
- Step-by-step instructions
- ~20 minutes total setup time

### Detailed References

📄 `docs/POLAR-PRODUCTS-SETUP-GUIDE.md` - Detailed guide (may have outdated sections)
📄 `docs/POLAR-QUICK-SETUP.md` - Quick reference
📄 `docs/POLAR-VISUAL-FLOW.md` - Visual diagrams

## What Was Corrected

❌ **OLD (WRONG):**

- Business plan at $50/month
- Yearly plans at $250/$500
- Multiple price IDs needed
- Complex price selection logic

✅ **NEW (CORRECT):**

- Only Pro plan at $25/month per user
- No yearly billing
- One price ID needed
- Simple, straightforward setup

## Your Pricing Model Explained

### Base Subscription

**$25/month per team member** via Polar

- Unlimited projects
- Access to premium AI models
- Priority processing

### Usage-Based Charges (Separate from Polar)

These are NOT handled by Polar, but by your own billing system:

| Resource         | Free Tier (Pro) | Overage Cost         |
| ---------------- | --------------- | -------------------- |
| AI Tokens        | 10M free        | Per-provider pricing |
| Database Storage | 5GB free        | $0.08/GB/month       |
| Object Storage   | 10GB free       | $0.04/GB/month       |
| Bandwidth        | 500GB free      | $0.08/GB             |
| Auth (MAU)       | 10,000 free     | $0.008/user          |

## Testing Checklist

```bash
# 1. Start dev server
npm run dev

# 2. Go to pricing page
http://localhost:3000/pricing

# 3. Click "Upgrade now" on Pro plan

# 4. Use test card
Card: 4242 4242 4242 4242
Date: Any future date
CVC: Any 3 digits

# 5. Verify
✓ Checkout completes
✓ Redirects to dashboard
✓ Webhook receives event
✓ Subscription created in DB
```

## Quick Setup

1. **Polar Dashboard** → Create Pro product → Create $25 monthly price
2. **Copy Price ID** → Add to `.env` as `POLAR_PRO_PRICE_ID`
3. **Setup Webhook** → Add secret to `.env` as `POLAR_WEBHOOK_SECRET`
4. **Test** → Visit /pricing → Click upgrade → Complete with test card

**Total Time: 20 minutes**

## Files Updated

✅ `docs/POLAR-SETUP-SIMPLIFIED.md` - New simplified guide  
✅ `src/app/api/payment/create-checkout/route.ts` - Uses `POLAR_PRO_PRICE_ID`  
✅ `.env.example` - Simplified environment variables  
✅ `src/app/api/webhooks/polar/route.ts` - Webhook handler (already created)

## Support

- **Quick Start**: `docs/POLAR-SETUP-SIMPLIFIED.md`
- **Polar Dashboard**: https://polar.sh/dashboard
- **Polar Docs**: https://docs.polar.sh
- **Your Org ID**: `8ca4b291-db7f-441e-8b4c-be94356f7a28`

---

**Start with `docs/POLAR-SETUP-SIMPLIFIED.md` for the clearest, most accurate guide!**
