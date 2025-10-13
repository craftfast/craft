# Migration from Razorpay to Polar.sh

This document outlines the changes made when migrating from Razorpay to Polar.sh payment integration.

## Summary

The Craft platform has migrated from Razorpay to Polar.sh for payment processing. This change affects the payment flow, API integration, and database schema.

## What Changed

### 1. Payment Integration Library

**Before:** `src/lib/razorpay.ts`
**After:** `src/lib/polar.ts`

Key function changes:

- `loadRazorpayScript()` → `loadPolarScript()`
- `initiateRazorpayPayment()` → `initiatePolarPayment()`
- `convertToSmallestUnit()` → `toSmallestUnit()`

### 2. Database Schema Changes

The following field names were updated in `prisma/schema.prisma`:

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

### 3. API Routes

**`src/app/api/payment/create-order/route.ts`:**

- Now uses `@polar-sh/sdk` instead of `razorpay` package
- Creates Polar checkout sessions instead of Razorpay orders
- Environment variables changed (see below)

**`src/app/api/payment/verify/route.ts`:**

- Uses Polar.sh verification instead of Razorpay signature verification
- Verifies checkout status via Polar API

### 4. Environment Variables

**Removed:**

```bash
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
```

**Added:**

```bash
POLAR_ACCESS_TOKEN
POLAR_PRODUCT_PRICE_ID
NEXT_PUBLIC_POLAR_KEY_ID
```

### 5. Frontend Updates

**`src/app/pricing/page.tsx`:**

- Imports from `@/lib/polar` instead of `@/lib/razorpay`
- Updated payment response handling
- Changed field names in payment callbacks

**`src/types/globals.d.ts`:**

- `window.Razorpay` → `window.Polar`

### 6. Documentation Pages

Updated payment processor references in:

- `src/app/terms/page.tsx` - Terms of Service
- `src/app/privacy/page.tsx` - Privacy Policy
- `src/app/refunds/page.tsx` - Refund Policy
- `src/app/help/page.tsx` - Help Center

### 7. Package Dependencies

**Removed:**

```json
"razorpay": "^2.9.6"
```

**Added:**

```json
"@polar-sh/sdk": "^0.14.0"
```

## Migration Steps for Developers

If you're working on this codebase, follow these steps:

### 1. Install New Dependencies

```bash
npm install
```

This will install the new `@polar-sh/sdk` package.

### 2. Update Environment Variables

Create or update `.env.local`:

```bash
# Remove old Razorpay variables
# Add new Polar.sh variables
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_PRODUCT_PRICE_ID=your_product_price_id
NEXT_PUBLIC_POLAR_KEY_ID=your_polar_public_key
```

Get your Polar.sh credentials from: https://polar.sh/dashboard

### 3. Run Database Migration

```bash
npx prisma migrate dev --name migrate_to_polar
```

This will update your database schema to use the new field names.

### 4. Update Seed Data (if applicable)

If you have seed data with payment information, update field names:

- `razorpayOrderId` → `polarCheckoutId`
- `razorpayPaymentId` → `polarPaymentId`

### 5. Test Payment Flow

1. Start development server: `npm run dev`
2. Navigate to `/pricing`
3. Test payment with Polar.sh test credentials
4. Verify success and error handling

## Breaking Changes

⚠️ **Important:** This is a breaking change for:

1. **Database:** Existing payment records with Razorpay IDs will not be automatically migrated
2. **API:** Any external integrations expecting Razorpay webhooks will need updates
3. **Environment:** All deployment environments need new Polar.sh credentials

## Currency Support

**Before:** INR (Indian Rupees) and USD
**After:** USD and EUR (Euro)

Polar.sh primarily supports USD and EUR. If you need INR support, consider keeping a currency converter or using a different payment processor.

## Payment Methods

**Razorpay supported:**

- Credit/Debit Cards
- UPI
- Net Banking
- Wallets

**Polar.sh supports:**

- Credit Cards
- Debit Cards

## Rollback Plan

If you need to rollback to Razorpay:

1. Restore `src/lib/razorpay.ts` from git history
2. Revert database schema changes
3. Restore environment variables
4. Reinstall `razorpay` package
5. Revert frontend and API changes

## Resources

- [Polar.sh Setup Guide](./polar-setup.md)
- [Polar.sh Documentation](https://docs.polar.sh)
- [Original Razorpay Setup](https://github.com/craftdottech/craft/blob/main/docs/razorpay-setup.md) (historical reference)

## Support

For questions about this migration:

- Check the [Polar.sh setup guide](./polar-setup.md)
- Review the [help documentation](/help)
- Contact support: support@craft.tech
