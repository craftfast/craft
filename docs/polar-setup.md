# Polar.sh Payment Integration Setup

This document explains how to set up Polar.sh payment integration for the Craft pricing page.

## Prerequisites

1. A Polar.sh account (sign up at https://polar.sh)
2. Polar.sh API access token

## Setup Steps

### 1. Install Polar.sh SDK

```bash
npm install @polar-sh/sdk
```

### 2. Environment Variables

Add the following to your `.env.local` file:

```bash
# Polar.sh Configuration
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_PRODUCT_PRICE_ID=your_product_price_id
NEXT_PUBLIC_POLAR_KEY_ID=your_polar_public_key
```

**Getting your keys:**

- Get your access token from your Polar.sh Dashboard → Settings → API Keys
- Create a product and price in Polar.sh Dashboard to get the Product Price ID
- Use test mode keys during development

### 3. Test the Integration

1. Navigate to `/pricing` on your local development server
2. Click on the "Upgrade to Pro" button
3. The Polar.sh payment modal should open
4. Complete the payment using Polar.sh test cards:
   - **Success**: Any valid card number in test mode
   - **Failure**: Simulate failures using specific test cards from Polar.sh docs

## How it Works

1. User clicks "Upgrade to Pro" on the pricing page
2. The app creates a checkout session via the API route `/api/payment/create-order`
3. Polar.sh checkout modal opens with payment options
4. After successful payment:
   - The payment is verified using Polar.sh webhook or signature verification
   - User's subscription status is updated in the database
   - User is redirected to the dashboard

## Payment Flow

```
User → Pricing Page → Create Checkout → Polar.sh Modal → Payment Success → Verify Payment → Update Subscription → Dashboard
```

## Security

- Never expose your `POLAR_ACCESS_TOKEN` in client-side code
- Only use the public key (`NEXT_PUBLIC_POLAR_KEY_ID`) on the frontend
- Always verify payment signatures on the backend
- Use webhooks for production to handle payment events reliably

## Production Checklist

- [ ] Replace test API keys with live keys in production `.env`
- [ ] Set up Polar.sh webhooks for payment events
- [ ] Test payment flow in live mode
- [ ] Configure proper error handling and logging
- [ ] Set up monitoring for payment failures

## Troubleshooting

### Payment Modal Doesn't Open

- Check that `NEXT_PUBLIC_POLAR_KEY_ID` is set correctly
- Verify the Polar.sh script is loading (check browser console)
- Ensure you're not blocking third-party scripts

### Payment Verification Fails

- Verify `POLAR_ACCESS_TOKEN` is correct
- Check that the checkout ID matches
- Review server logs for specific error messages

## Resources

- [Polar.sh Documentation](https://docs.polar.sh)
- [Polar.sh API Reference](https://api.polar.sh/docs)
- [Polar.sh Dashboard](https://polar.sh/dashboard)

## Support

For issues specific to Polar.sh integration:

- Check Polar.sh documentation: https://docs.polar.sh
- Contact Polar.sh support: support@polar.sh
- Review our help documentation: `/help`
