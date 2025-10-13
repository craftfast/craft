# Craft Pricing Page - Implementation Summary

## Overview

Successfully implemented a comprehensive pricing page for Craft with three tiers: Free, Premium, and Enterprise. The page includes Razorpay payment integration with automatic currency detection based on user location.

## Features Implemented

### 1. Pricing Page (`/pricing`)

- **Location**: `src/app/pricing/page.tsx`
- **Features**:
  - Three pricing tiers with detailed feature lists
  - Automatic currency detection (INR for India, USD for others)
  - Responsive design following Craft design system
  - Popular plan highlighting (Premium)
  - FAQ section
  - Contact support CTA

### 2. Pricing Plans

#### Free Plan ($0/month or ₹0/month)

**Target**: Prototypes and side projects

**Features**:

- ✅ Chat with AI to craft an app
- ✅ Unlimited projects (max 1,000 to prevent abuse)
- ✅ Deploy apps to Vercel
- ✅ Import from Figma
- ✅ Sync with GitHub
- ✅ Limited database access (0.5GB per project)
- ✅ Bring your own OpenRouter API key
- ✅ Limited user memory for context sharing
- ✅ Community support
- ✅ Pay-as-you-go: $20 per 1M tokens
- ❌ No included AI tokens
- ❌ No priority support

#### Premium Plan ($500/month or ₹41,500/month)

**Target**: Startups and growing teams

**Features**:

- ✅ Everything in Free
- ✅ **1M tokens per day** (included)
- ✅ Extended memory for personalized code
- ✅ Priority support
- ✅ Human oversight help when needed
- ✅ Advanced AI capabilities
- ✅ Faster response times
- ✅ Priority deployment queue
- ✅ Enhanced context sharing
- ✅ Premium integrations

#### Enterprise Plan (Contact Us)

**Target**: Large companies requiring additional security

**Features**:

- ✅ Everything in Premium
- ✅ **Training opt-out by default**
- ✅ SAML SSO
- ✅ Priority access with no queues
- ✅ Dedicated support team
- ✅ Human oversight on demand
- ✅ Custom security policies
- ✅ SLA guarantees
- ✅ Custom integrations
- ✅ Unlimited projects
- ✅ Advanced analytics

### 3. Razorpay Payment Integration

#### Files Created:

1. **`src/lib/razorpay.ts`** - Payment utility functions

   - `loadRazorpayScript()` - Loads Razorpay SDK
   - `initiateRazorpayPayment()` - Starts payment process
   - `verifyPayment()` - Verifies payment signature
   - `convertToSmallestUnit()` - Converts amount to paise/cents
   - `getPlanPrice()` - Returns plan price by currency

2. **`src/app/api/payment/create-order/route.ts`** - Creates Razorpay orders
3. **`src/app/api/payment/verify/route.ts`** - Verifies payment signatures

#### Payment Flow:

1. User clicks "Start Premium"
2. Location detected → Currency determined (INR/USD)
3. Order created via API endpoint
4. Razorpay payment modal opens
5. User completes payment
6. Payment verified via signature
7. User subscription updated
8. Redirect to dashboard

#### Supported Payment Methods (via Razorpay):

- Credit/Debit Cards (Visa, MasterCard, Amex, etc.)
- UPI (India)
- Net Banking (India)
- Wallets (Paytm, PhonePe, etc.)
- International cards

### 4. Currency Detection

- Uses IP geolocation API (`ipapi.co`) to detect user location
- Automatically shows INR for Indian users
- Shows USD for all other users
- Graceful fallback to USD if detection fails

### 5. Design System Compliance

All components follow Craft design system guidelines:

- ✅ Neutral colors only (no blue, green, red, etc.)
- ✅ Rounded corners (`rounded-full`, `rounded-2xl`)
- ✅ Dark mode support
- ✅ Consistent spacing and typography
- ✅ Accessible UI elements

## Setup Instructions

### 1. Install Dependencies

```bash
npm install razorpay
```

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Get Razorpay Keys

1. Sign up at https://razorpay.com
2. Go to Dashboard → Settings → API Keys
3. Use **Test Mode** keys for development
4. Use **Live Mode** keys for production

### 4. Test Payment

- Test Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

## Database Schema Update Needed

Add subscription fields to User model in Prisma:

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  subscriptionPlan  String    @default("Free") // "Free", "Premium", "Enterprise"
  subscriptionStart DateTime?
  subscriptionEnd   DateTime?
  razorpayCustomerId String?
  razorpayPaymentId  String?
  tokenUsage        Int       @default(0) // Track daily token usage
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

## Next Steps

### Immediate:

1. ✅ Add Razorpay credentials to `.env.local`
2. ⏳ Test payment flow with test credentials
3. ⏳ Update Prisma schema with subscription fields
4. ⏳ Implement subscription update logic in payment verification

### Short-term:

- Implement subscription management dashboard
- Add email notifications for successful payments
- Create invoice generation
- Add subscription renewal/cancellation logic
- Implement usage tracking for token limits
- Add webhook handlers for Razorpay events

### Long-term:

- Implement annual billing option
- Add team management for Premium/Enterprise
- Create usage analytics dashboard
- Implement automatic scaling for Enterprise
- Add referral program
- Implement seat-based pricing

## Documentation

- **Razorpay Setup Guide**: `docs/razorpay-setup.md`
- **Design System**: `docs/design-system.md`
- **Environment Variables**: `.env.example`

## Testing Checklist

### Functional Testing:

- [ ] Free plan signup works
- [ ] Premium payment modal opens
- [ ] Test payment completes successfully
- [ ] Payment verification works
- [ ] Enterprise contact form works
- [ ] Currency detection works for India
- [ ] Currency detection works for other countries
- [ ] Mobile responsive design
- [ ] Dark mode works correctly

### Edge Cases:

- [ ] Payment cancellation handling
- [ ] Network failure during payment
- [ ] Invalid payment details
- [ ] Location detection failure
- [ ] Razorpay script load failure

## Known Limitations

1. **IP Geolocation**: May not be 100% accurate for VPN users
2. **Subscription Management**: Not yet implemented
3. **Email Notifications**: Not yet integrated
4. **Invoicing**: Not yet implemented
5. **Webhooks**: Need to be set up for automated updates

## Support

For questions or issues:

- Email: support@craft.tech
- Documentation: `docs/razorpay-setup.md`
- GitHub Issues: https://github.com/craftdottech/craft/issues

---

**Last Updated**: October 4, 2025
**Version**: 1.0.0
**Status**: ✅ Development Ready
