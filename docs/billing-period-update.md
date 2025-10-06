# Billing Period Update - Currency to Monthly/Yearly

## Summary

Replaced the currency toggle (USD/INR) with a billing period toggle (Monthly/Yearly) throughout the pricing system.

## Changes Made

### 1. `src/lib/pricing-constants.ts`

- **Removed**: Currency-based pricing (USD/INR)
- **Added**: Billing period-based pricing (Monthly/Yearly)
- Updated PRICING object:

  - `priceUSD` → `priceMonthly`
  - `priceINR` → `priceYearly`
  - `displayPriceUSD` → `displayPriceMonthly`
  - `displayPriceINR` → `displayPriceYearly`
  - `pricePerCreditUSD` → `pricePerCreditMonthly`
  - `pricePerCreditINR` → `pricePerCreditYearly`

- **Removed**: `CURRENCY` constant
- **Added**: `BILLING_PERIOD` constant with Monthly/Yearly options
- **Updated**: `TOKEN_PRICING` simplified to single USD pricing

- **Type Changes**:

  - `CurrencyCode` → `BillingPeriod`
  - Type values: `"MONTHLY" | "YEARLY"`

- **Function Updates**:
  - `getPlanPrice(planName, billingPeriod)` - now uses billing period instead of currency
  - `getDisplayPrice(planName, billingPeriod)` - now uses billing period instead of currency
  - `calculateTierPrice(planName, credits, billingPeriod)` - now uses billing period instead of currency
  - `getTierDisplayPrice(planName, credits, billingPeriod)` - now uses billing period instead of currency

### 2. `src/app/pricing/page.tsx`

- **Removed**:
  - `useUserLocation()` hook for detecting user's country
  - Currency detection and auto-selection logic
  - `selectedCurrency` state variable
- **Added**:

  - `billingPeriod` state variable (type: `BillingPeriod`)
  - Billing period toggle UI (Monthly/Yearly)
  - Yearly billing discount indicator ("Save ~17%")

- **Updated PricingPlan Interface**:

  - `priceUSD` → `priceMonthly`
  - `priceINR` → `priceYearly`

- **Updated Payment Handlers**:

  - `handleProPayment()` - uses billing period, hardcoded currency to "USD"
  - `handleBusinessPayment()` - uses billing period, hardcoded currency to "USD"
  - Payment descriptions now include billing period info

- **Updated UI**:
  - Toggle buttons: "USD ($)" / "INR (₹)" → "Monthly" / "Yearly"
  - Removed location detection indicator
  - Added yearly savings indicator
  - Price display shows `/month` or `/year` based on selection
  - Credit pricing shows period-specific rates

### 3. Pricing Structure

#### Free Plan

- Monthly: $0
- Yearly: $0

#### Pro Plan (Base 100 credits)

- Monthly: $25 ($0.25/credit)
- Yearly: $250 ($2.50/credit/year)
- ~17% discount on yearly billing

#### Business Plan (Base 100 credits)

- Monthly: $50 ($0.50/credit)
- Yearly: $500 ($5.00/credit/year)
- ~17% discount on yearly billing

#### Enterprise Plan

- Both periods: Custom pricing

## Benefits

1. **Simplified Pricing**: Single currency (USD) reduces complexity
2. **Clear Billing Options**: Users can easily see monthly vs yearly pricing
3. **Yearly Incentive**: ~17% discount encourages annual commitments
4. **Better UX**: No need for location detection or currency conversion
5. **Easier Maintenance**: Single currency simplifies payment processing

## Testing Notes

The development server is running successfully on port 3002 with no compilation errors.

## Migration Notes

If you have existing pricing data in INR or need to support multiple currencies in the future, you would need to:

1. Add back the CURRENCY constant
2. Update the types to support multiple currencies
3. Update the payment processing logic
4. Consider storing user's preferred currency in their profile
