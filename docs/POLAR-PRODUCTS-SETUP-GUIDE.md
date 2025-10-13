# Polar Products & Pricing Setup Guide

This guide will help you set up products and pricing in Polar.sh to match your Craft platform configuration.

## Overview

Your Craft platform has the following pricing structure:

- **FREE Plan**: $0/month
- **PRO Plan**: $25/month or $250/year
- **BUSINESS Plan**: $50/month or $500/year
- **ENTERPRISE Plan**: Custom pricing (contact sales)

## Step 1: Access Polar Dashboard

1. Go to https://polar.sh/dashboard
2. Log in with your account
3. Navigate to your organization: `8ca4b291-db7f-441e-8b4c-be94356f7a28`

## Step 2: Create Product

You need to create **1 product** (excluding FREE and ENTERPRISE):

### Product: Craft Pro

1. Go to **Products** → **Create Product**
2. Fill in:
   - **Name**: `Craft Pro`
   - **Description**: `Professional plan: $25/month per user. Unlimited projects, usage-based pricing for AI tokens, database, storage, and bandwidth beyond free tiers.`
   - **Type**: `Subscription` (recurring)
   - **Visibility**: `Public`

## Step 3: Create Price for the Product

### For Craft Pro Product:

#### Pro Monthly Price (per user)

- **Amount**: `$25.00 USD`
- **Billing Period**: `Monthly`
- **Currency**: `USD`
- **Type**: `Recurring`
- **Price ID**: Copy this ID → You'll need it as `POLAR_PRO_PRICE_ID`

**Note**: This is per-user/per-seat pricing. Each team member will be charged $25/month.

## Step 4: Update Environment Variables

Update your `.env` file with the price ID:

```bash
# Polar Payment Gateway Configuration
POLAR_ACCESS_TOKEN=polar_oat_JpmpoCe3mjc7kyaRlK6c5DCrmQ7tuRAX72HOu26surW
POLAR_ORGANIZATION_ID=8ca4b291-db7f-441e-8b4c-be94356f7a28

# Product Price ID (get this from Polar dashboard)
POLAR_PRO_PRICE_ID=your_pro_price_id_here

# Webhook secret for verifying Polar webhook events
POLAR_WEBHOOK_SECRET=your_webhook_secret

# Legacy - can be removed after updating code
POLAR_PRODUCT_PRICE_ID=3bfab9d0-64b8-4cf8-a8ab-1cf6ba91846e
```

## Step 5: Update Your Code

Your code is already mostly configured correctly! The checkout already uses the Pro plan pricing.

### Verify `src/app/api/payment/create-checkout/route.ts`

Ensure it uses the environment variable:

```typescript
productPriceId: process.env.POLAR_PRO_PRICE_ID || process.env.POLAR_PRODUCT_PRICE_ID!,
```

**That's it!** Your pricing page already handles Pro plan at $25/month correctly. No complex logic needed since you only have one paid plan with monthly billing.## Step 6: Configure Webhooks (Important!)

To handle subscription events (renewals, cancellations, etc.), set up webhooks:

1. In Polar Dashboard → **Settings** → **Webhooks**
2. Click **Add Endpoint**
3. Set URL to: `https://yourdomain.com/api/webhooks/polar`
4. Select events:
   - `checkout.completed`
   - `checkout.failed`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.cancelled`
   - `subscription.expired`
5. Copy the **Webhook Secret** → Add to `.env` as `POLAR_WEBHOOK_SECRET`

## Step 7: Create Webhook Handler

Create `src/app/api/webhooks/polar/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";
import { prisma } from "@/lib/prisma";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("polar-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 401 });
    }

    // Verify webhook signature
    const event = polar.webhooks.verify(
      body,
      signature,
      process.env.POLAR_WEBHOOK_SECRET!
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.completed":
        // Update subscription in database
        await handleCheckoutCompleted(event.data);
        break;

      case "subscription.cancelled":
        // Mark subscription as cancelled
        await handleSubscriptionCancelled(event.data);
        break;

      // Add more event handlers as needed
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}

async function handleCheckoutCompleted(data: any) {
  // Update your database with the completed checkout
  // Link the subscription to the user/team
}

async function handleSubscriptionCancelled(data: any) {
  // Update subscription status in your database
}
```

## Step 8: Test the Integration

### Test in Sandbox Mode

1. Enable **Test Mode** in Polar Dashboard
2. Use test credit cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - More test cards: https://docs.polar.sh/testing

### Test Flow

1. Go to `/pricing` on your local dev server
2. Click "Upgrade to Pro" (monthly)
3. Complete checkout with test card
4. Verify:
   - Checkout succeeds
   - Webhook is triggered
   - Database is updated
   - User is redirected correctly

## Step 9: Production Deployment

Before going live:

- [ ] Switch from Test Mode to Live Mode in Polar
- [ ] Update all environment variables with live keys
- [ ] Test the complete flow with a real card
- [ ] Set up monitoring for failed payments
- [ ] Configure email notifications for subscription events
- [ ] Test webhook delivery and retries

## Pricing Configuration Reference

Your current pricing from `src/lib/pricing-constants.ts`:

```typescript
PRO: {
    priceMonthly: 25,      // $25/month
    priceYearly: 250,       // $250/year (17% discount)
}

BUSINESS: {
    priceMonthly: 50,      // $50/month
    priceYearly: 500,       // $500/year (17% discount)
}
```

## Common Issues & Solutions

### Issue: "Product price not found"

**Solution**: Verify the price ID is correctly copied from Polar dashboard

### Issue: Webhook not receiving events

**Solution**:

- Check webhook URL is publicly accessible
- Verify webhook secret is correct
- Check webhook event filters in Polar dashboard

### Issue: Checkout fails silently

**Solution**:

- Check browser console for errors
- Verify API keys are correct
- Check server logs for detailed error messages

## Next Steps

After completing this setup:

1. **Test thoroughly** in sandbox mode
2. **Create webhook handler** for subscription management
3. **Update UI** to show current subscription status
4. **Add subscription management** (upgrade/downgrade/cancel)
5. **Monitor payments** and handle failures gracefully

## Support & Resources

- **Polar Documentation**: https://docs.polar.sh
- **Polar API Reference**: https://api.polar.sh/docs
- **Polar Dashboard**: https://polar.sh/dashboard
- **Polar Support**: support@polar.sh

## Your Current Setup

✅ **Organization ID**: `8ca4b291-db7f-441e-8b4c-be94356f7a28`  
✅ **Access Token**: Configured in `.env`  
⚠️ **Price IDs**: Need to be created and configured (follow steps above)

---

**Need Help?** Review the existing implementation in:

- `src/lib/polar.ts` - Payment utilities
- `src/app/api/payment/create-checkout/route.ts` - Checkout creation
- `src/lib/pricing-constants.ts` - Pricing configuration
