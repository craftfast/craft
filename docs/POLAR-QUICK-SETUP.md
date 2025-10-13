# Polar Products Setup - Quick Reference

## 🎯 Quick Setup Checklist

### 1. Create Products in Polar Dashboard

| Product            | Monthly Price | Yearly Price | Features                                           |
| ------------------ | ------------- | ------------ | -------------------------------------------------- |
| **Craft Pro**      | $25           | $250         | Unlimited projects, 5GB database, priority support |
| **Craft Business** | $50           | $500         | 20GB database, SSO, all Pro features               |

### 2. Get Your Price IDs

After creating products and prices in Polar, copy the Price IDs:

```bash
# Add to your .env file
POLAR_PRO_MONTHLY_PRICE_ID=xxxx-xxxx-xxxx-xxxx
POLAR_PRO_YEARLY_PRICE_ID=xxxx-xxxx-xxxx-xxxx
POLAR_BUSINESS_MONTHLY_PRICE_ID=xxxx-xxxx-xxxx-xxxx
POLAR_BUSINESS_YEARLY_PRICE_ID=xxxx-xxxx-xxxx-xxxx
POLAR_WEBHOOK_SECRET=whsec_xxxx
```

### 3. Update Code

**File**: `src/app/api/payment/create-checkout/route.ts`

Add this function before the POST handler:

```typescript
function getPriceId(planName: string, billingPeriod: string): string {
  const priceMap: Record<string, string> = {
    PRO_MONTHLY: process.env.POLAR_PRO_MONTHLY_PRICE_ID!,
    PRO_YEARLY: process.env.POLAR_PRO_YEARLY_PRICE_ID!,
    BUSINESS_MONTHLY: process.env.POLAR_BUSINESS_MONTHLY_PRICE_ID!,
    BUSINESS_YEARLY: process.env.POLAR_BUSINESS_YEARLY_PRICE_ID!,
  };

  const key = `${planName}_${billingPeriod}`;
  const priceId = priceMap[key];

  if (!priceId) {
    throw new Error(`No price ID configured for ${planName} ${billingPeriod}`);
  }

  return priceId;
}
```

Replace:

```typescript
productPriceId: process.env.POLAR_PRODUCT_PRICE_ID!,
```

With:

```typescript
productPriceId: getPriceId(body.planName, body.billingPeriod),
```

### 4. Test

```bash
# Start dev server
npm run dev

# Go to http://localhost:3000/pricing
# Click upgrade button
# Complete checkout with test card: 4242 4242 4242 4242
```

## 📋 Polar Dashboard URLs

- **Dashboard**: https://polar.sh/dashboard
- **Products**: https://polar.sh/dashboard/products
- **Webhooks**: https://polar.sh/dashboard/settings/webhooks
- **API Keys**: https://polar.sh/dashboard/settings/api-keys

## 🧪 Test Cards

| Card Number           | Scenario              |
| --------------------- | --------------------- |
| `4242 4242 4242 4242` | ✅ Success            |
| `4000 0000 0000 0002` | ❌ Declined           |
| `4000 0000 0000 9995` | ❌ Insufficient funds |

## ⚡ Quick Commands

```bash
# Check environment variables
cat .env | grep POLAR

# Test API connection
curl -X GET https://api.polar.sh/v1/products \
  -H "Authorization: Bearer $POLAR_ACCESS_TOKEN"

# View Polar logs
# Go to https://polar.sh/dashboard/logs
```

## 🐛 Common Issues

### Problem: "Product price ID not found"

```bash
# Check your .env has the correct price IDs
echo $POLAR_PRO_MONTHLY_PRICE_ID
```

### Problem: Checkout doesn't open

```bash
# Check browser console for errors
# Verify API key in .env
# Check server logs: npm run dev
```

### Problem: Webhook not receiving events

```bash
# Verify webhook URL is publicly accessible
# Check webhook secret matches .env
# View webhook logs in Polar dashboard
```

## 📞 Support

- **Full Guide**: `docs/POLAR-PRODUCTS-SETUP-GUIDE.md`
- **Polar Docs**: https://docs.polar.sh
- **Polar Support**: support@polar.sh

## ✅ Completion Checklist

- [ ] Created Craft Pro product in Polar
- [ ] Created Craft Business product in Polar
- [ ] Added 2 prices (monthly/yearly) for each product
- [ ] Copied all 4 price IDs to .env
- [ ] Updated create-checkout route.ts
- [ ] Set up webhook endpoint
- [ ] Added webhook secret to .env
- [ ] Tested checkout flow with test card
- [ ] Verified webhook delivery
- [ ] Ready for production!
