# Migration Guide: Razorpay to Polar.sh

This guide documents the complete migration from Razorpay to Polar.sh payment processing.

## What Changed

### 1. Dependencies

**Removed:**

```json
"razorpay": "^2.9.6"
```

**Added:**

```json
"@polar-sh/nextjs": "^0.4.9",
"@polar-sh/sdk": "^0.14.0",
"zod": "^4.1.12"
```

### 2. Environment Variables

**Old (Razorpay):**

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**New (Polar.sh):**

```env
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_ORGANIZATION_ID=your_organization_id
POLAR_PRODUCT_PRICE_ID=your_product_price_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Schema Changes

The Prisma schema has been updated to replace Razorpay fields with Polar fields:

**TeamSubscription model:**

- `razorpayOrderId` → `polarCheckoutId`
- `razorpayPaymentId` → `polarPaymentId`

**Invoice model:**

- `razorpayOrderId` → `polarCheckoutId`
- `razorpayPaymentId` → `polarPaymentId`

**PaymentTransaction model:**

- `paymentMethod` default: `"razorpay"` → `"polar"`
- `razorpayOrderId` → `polarCheckoutId`
- `razorpayPaymentId` → `polarPaymentId`
- `razorpaySignature` → `polarSignature`

### 4. Code Changes

**Files Modified:**

- `src/lib/razorpay.ts` → Replaced with `src/lib/polar.ts`
- `src/app/api/payment/create-order/route.ts` → Updated for Polar SDK
- `src/app/api/payment/verify/route.ts` → Updated for Polar SDK
- `src/app/api/payment/create-checkout/route.ts` → New file
- `src/app/api/payment/status/route.ts` → New file
- `src/app/pricing/page.tsx` → Updated payment flow
- `src/types/globals.d.ts` → Updated Window interface
- `prisma/schema.prisma` → Updated field names

**Documentation Pages Updated:**

- `src/app/terms/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/refunds/page.tsx`
- `src/app/help/page.tsx`

### 5. Payment Flow Changes

**Old Flow (Razorpay):**

1. Create order on backend
2. Load Razorpay script on frontend
3. Open Razorpay modal
4. User completes payment in modal
5. Verify signature on backend

**New Flow (Polar.sh):**

1. Create checkout session on backend
2. Redirect user to Polar hosted checkout
3. User completes payment on Polar.sh
4. User redirected back to app
5. Verify checkout status via Polar API

## Migration Steps

### Step 1: Update Environment Variables

1. Sign up for Polar.sh account
2. Get your Access Token, Organization ID, and Product Price ID
3. Update `.env.local` with new Polar.sh credentials
4. Remove old Razorpay environment variables

### Step 2: Run Database Migration

```bash
# Generate Prisma migration
npx prisma migrate dev --name migrate_to_polar

# Or apply the migration
npx prisma migrate deploy
```

### Step 3: Update Existing Data (Optional)

If you have existing payment records, you may want to keep them for historical purposes. The old Razorpay fields can remain in the database, or you can manually migrate them:

```sql
-- Example: Keep both old and new fields for transition period
-- No action needed if you want to preserve historical data

-- Or, if you want to clear old payment data:
UPDATE "TeamSubscription" SET "polarCheckoutId" = NULL, "polarPaymentId" = NULL;
UPDATE "Invoice" SET "polarCheckoutId" = NULL, "polarPaymentId" = NULL;
UPDATE "PaymentTransaction" SET "paymentMethod" = 'polar';
```

### Step 4: Install Dependencies

```bash
pnpm install @polar-sh/nextjs @polar-sh/sdk zod
```

### Step 5: Test Payment Flow

1. Start your development server
2. Navigate to `/pricing`
3. Click "Upgrade to Pro"
4. Complete a test payment using Polar test mode
5. Verify successful redirect and status check

### Step 6: Update Documentation

Review and update:

- Terms of Service
- Privacy Policy
- Refund Policy
- Help Center content

## Key Differences

| Feature           | Razorpay               | Polar.sh                  |
| ----------------- | ---------------------- | ------------------------- |
| **Integration**   | Modal-based (embedded) | Redirect-based (hosted)   |
| **Payment Page**  | Embedded modal         | Polar-hosted checkout     |
| **Verification**  | HMAC signature         | API status check          |
| **Currencies**    | INR, USD, 100+         | USD, EUR, others          |
| **Target Market** | India-focused          | Global, developer-focused |

## Benefits of Polar.sh

1. **Developer-First:** Built specifically for software/SaaS products
2. **Simple Integration:** Hosted checkout reduces PCI compliance burden
3. **Modern UX:** Clean, professional checkout experience
4. **Transparent Pricing:** Clear fee structure
5. **Better for Global:** Optimized for USD/EUR markets

## Rollback Plan

If you need to rollback to Razorpay:

1. Restore old environment variables
2. Revert code changes (git revert)
3. Restore Prisma schema
4. Run migration to restore old fields
5. Reinstall razorpay package

## Support

- Polar.sh Documentation: https://polar.sh/docs
- Polar.sh Support: support@polar.sh
- Craft Support: support@craft.tech

## Completed

✅ Dependency changes
✅ Environment variable updates
✅ Database schema migration
✅ API route updates
✅ Frontend payment flow
✅ Documentation updates
✅ Type definitions
✅ Error handling
✅ Success/failure redirects

Migration completed successfully!
