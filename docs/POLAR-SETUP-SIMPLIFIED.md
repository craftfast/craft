# Polar Products & Pricing Setup Guide (Simplified)

This guide will help you set up products and pricing in Polar.sh to match your **actual** Craft platform configuration.

## Your Actual Pricing Model

Based on your pricing page at `src/app/pricing/page.tsx`:

- **Hobby (FREE)**: $0/month - Hard limits on all resources
- **Pro**: **$25/month per user** - Pay-as-you-go for usage beyond free tiers
- **Enterprise**: Custom pricing (contact sales)

**Key Points:**

- ✅ Only **monthly billing** (no yearly plans)
- ✅ Only **one paid tier** (Pro at $25/month)
- ✅ **Per-user pricing** ($25 per team member)
- ✅ **Usage-based** billing for everything beyond the base subscription
- ❌ No Business plan
- ❌ No yearly billing

## What You Need to Create in Polar

You only need to create **ONE product with ONE price**:

### Step 1: Access Polar Dashboard

1. Go to https://polar.sh/dashboard
2. Log in with your account
3. Navigate to your organization: `8ca4b291-db7f-441e-8b4c-be94356f7a28`

### Step 2: Create Product

1. Click **Products** → **Create Product**
2. Fill in:
   - **Name**: `Craft Pro`
   - **Description**: `Professional plan: $25/month per user. Includes unlimited projects and pay-as-you-go pricing for AI tokens, database, storage, and bandwidth.`
   - **Type**: `Subscription` (recurring)
   - **Visibility**: `Public`
3. Click **Create**

### Step 3: Create Price

1. In your Craft Pro product, click **Add Price**
2. Fill in:
   - **Amount**: `$25.00`
   - **Currency**: `USD`
   - **Billing Period**: `Monthly`
   - **Type**: `Recurring`
   - **Billing Type**: `Per seat` (since it's $25 per team member)
3. Click **Create Price**
4. **Copy the Price ID** - you'll need this!

### Step 4: Update Environment Variables

Add the price ID to your `.env` file:

```bash
# Polar Payment Gateway Configuration
POLAR_ACCESS_TOKEN=polar_oat_JpmpoCe3mjc7kyaRlK6c5DCrmQ7tuRAX72HOu26surW
POLAR_ORGANIZATION_ID=8ca4b291-db7f-441e-8b4c-be94356f7a28

# Product Price ID (the one you just copied)
POLAR_PRO_PRICE_ID=your_price_id_here

# Webhook secret (get this after setting up webhooks)
POLAR_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 5: Update Your Code

Update `src/app/api/payment/create-checkout/route.ts` to use the new environment variable.

Find this line:

```typescript
productPriceId: process.env.POLAR_PRODUCT_PRICE_ID!,
```

Replace with:

```typescript
productPriceId: process.env.POLAR_PRO_PRICE_ID || process.env.POLAR_PRODUCT_PRICE_ID!,
```

That's it! Your pricing page already handles everything correctly since you only have one paid plan.

### Step 6: Configure Webhooks

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

## Testing

```bash
# Start dev server
npm run dev

# Go to pricing page
http://localhost:3000/pricing

# Click "Upgrade now" on Pro plan
# Complete checkout with test card: 4242 4242 4242 4242
```

## Usage-Based Billing

After the base $25/month subscription, you charge for:

1. **AI Tokens**: Pay per token as per provider pricing
2. **Database Storage**: $0.08/GB/month after 5GB free
3. **Object Storage**: $0.04/GB/month after 10GB free
4. **Bandwidth**: $0.08/GB after 500GB free
5. **Authentication**: $0.008/MAU after 10,000 free

These usage charges are separate from the Polar subscription and handled by your own billing system.

## Summary

**In Polar, you only need:**

- 1 Product: "Craft Pro"
- 1 Price: $25/month (per user)
- 1 Environment Variable: `POLAR_PRO_PRICE_ID`

**Everything else (usage-based charges) is handled by your own billing system**, not by Polar.

## Your Current Setup

✅ **Organization ID**: `8ca4b291-db7f-441e-8b4c-be94356f7a28`  
✅ **Access Token**: Configured in `.env`  
⚠️ **Price ID**: Need to create product and add to `.env`  
⚠️ **Webhook**: Need to setup and add secret to `.env`

## Next Steps

1. **Create product in Polar** (5 minutes)
2. **Create price** (2 minutes)
3. **Copy price ID to .env** (1 minute)
4. **Update checkout code** (2 minutes)
5. **Setup webhook** (5 minutes)
6. **Test** (5 minutes)

**Total Time: ~20 minutes**

---

For the complete webhook implementation, see `src/app/api/webhooks/polar/route.ts` (already created).
