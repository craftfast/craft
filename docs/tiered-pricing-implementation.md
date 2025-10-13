# Tiered Credit-Based Pricing Implementation

## Overview

The pricing system has been updated to support **tiered credit-based pricing** for Pro and Business plans. Users can now select how many credits they want per month, from 100 to 10,000 credits, with pricing scaling linearly.

## Pricing Structure

### Pro Plan

- **Base Price**: $25 (₹2,075) for 100 credits
- **Price per Credit**: $0.25 (₹20.75)
- **Range**: 100 - 10,000 credits per month
- **Examples**:
  - 100 credits = $25 (₹2,075)
  - 200 credits = $50 (₹4,150)
  - 500 credits = $125 (₹10,375)
  - 1,000 credits = $250 (₹20,750)
  - 2,000 credits = $500 (₹41,500)
  - 5,000 credits = $1,250 (₹103,750)
  - 10,000 credits = $2,500 (₹207,500)

### Business Plan

- **Base Price**: $50 (₹4,150) for 100 credits
- **Price per Credit**: $0.50 (₹41.50)
- **Range**: 100 - 10,000 credits per month
- **Examples**:
  - 100 credits = $50 (₹4,150)
  - 200 credits = $100 (₹8,300)
  - 500 credits = $250 (₹20,750)
  - 1,000 credits = $500 (₹41,500)
  - 2,000 credits = $1,000 (₹83,000)
  - 5,000 credits = $2,500 (₹207,500)
  - 10,000 credits = $5,000 (₹415,000)

### Free Plan

- **Price**: $0 (₹0)
- **Credits**: 20 credits per month
- **Daily Limit**: 5 credits per day
- **No customization available**

### Enterprise Plan

- **Price**: Custom
- **Credits**: Custom allocation
- **Contact sales for pricing**

## Features

### Credit Selector UI

- **Quick Select Buttons**: Pre-defined credit tiers (100, 200, 500, 1K, 2K, 5K, 10K)
- **Custom Input**: Enter any amount between 100-10,000 (must be multiples of 100)
- **Real-time Pricing**: Price updates dynamically as users select different credit amounts
- **Currency Support**: Automatic pricing in USD or INR based on user location

### User Experience

1. Users see the base pricing (100 credits) by default
2. They can click quick-select buttons for common credit amounts
3. Or enter a custom amount in the input field
4. Price updates in real-time showing total cost per month
5. Price per credit is displayed below the total
6. Selected credits are reflected in the feature list

## Technical Implementation

### Updated Files

#### `src/lib/pricing-constants.ts`

Added new properties to Pro and Business plans:

- `baseCredits`: Base credit amount (100)
- `basePriceUSD` / `basePriceINR`: Base prices
- `pricePerCreditUSD` / `pricePerCreditINR`: Price per individual credit
- `minCredits` / `maxCredits`: Valid credit range

New helper functions:

- `calculateTierPrice()`: Calculate price for given credits
- `getTierDisplayPrice()`: Get formatted display price
- `getCreditTiers()`: Get suggested credit tier options
- `isValidCreditAmount()`: Validate credit amount

#### `src/app/pricing/page.tsx`

- Added state management for Pro and Business credit selection
- Added credit selector UI with quick-select buttons and custom input
- Updated pricing display to show real-time calculated prices
- Modified payment handlers to use selected credit amounts
- Added per-credit pricing display

### Calculation Formula

```typescript
// For Pro Plan
totalPrice = credits × $0.25 (or credits × ₹20.75 for INR)

// For Business Plan
totalPrice = credits × $0.50 (or credits × ₹41.50 for INR)
```

### Validation Rules

- Minimum credits: 100
- Maximum credits: 10,000
- Credits must be in multiples of 100
- Values are clamped to valid range automatically

## Payment Integration

The Razorpay payment integration has been updated to:

1. Calculate the total amount based on selected credits
2. Include credit amount in the payment description
3. Pass the subscription details for proper billing

## User Interface Components

### Credit Selector

- **Location**: Within Pro and Business plan cards
- **Components**:
  - Label: "Select Credits"
  - Quick select grid: 2-column layout with 7 tier options
  - Custom input field with validation
  - Helper text showing valid range

### Pricing Display

- **Total Price**: Large, prominent display
- **Per-Credit Price**: Smaller text below total
- **Monthly Label**: "/month" suffix for clarity
- **Dynamic Updates**: Price changes as credits are selected

### Visual Design

- Follows Craft design system with neutral colors
- Rounded buttons and inputs (rounded-lg, rounded-full)
- Dark mode support
- Hover states and transitions
- Selected state highlighting

## Benefits

1. **Flexibility**: Users pay only for what they need
2. **Scalability**: Easy to scale up or down based on usage
3. **Transparency**: Clear pricing per credit
4. **User Control**: Custom amounts for precise budgeting
5. **Fair Pricing**: Linear scaling with no hidden fees

## Future Enhancements

Potential improvements:

- Volume discounts for higher tiers
- Annual billing option with discount
- Credit usage analytics
- Auto-scaling recommendations based on usage patterns
- Credit purchase add-ons (buy more credits mid-month)

## Testing

To test the implementation:

1. Visit `/pricing` page
2. Observe Pro and Business plans with credit selectors
3. Click different credit tier buttons
4. Enter custom amounts in the input field
5. Verify pricing updates correctly in both USD and INR
6. Check that payment flow includes selected credit amount

## Notes

- Free and Enterprise plans don't have credit selectors (fixed amounts)
- Credit rollover still applies to Pro and Business plans
- No daily limits for Pro and Business (unlike Free plan)
- All features remain the same regardless of credit amount selected
- The only difference between tiers is the number of credits per month
