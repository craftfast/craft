# Craft Pricing Model (2025)

## Business Model Overview

Craft is a comprehensive platform that provides **everything needed to build and host apps from scratch**. We partner with AI labs, hosting providers, database providers, and other service providers on the backend to deliver a seamless, integrated development experience with centralized billing.

## Core Services Provided

1. **AI Chat & Code Generation**
   - Multiple AI models (Claude, GPT-4, Grok, Gemini, etc.)
   - Direct partnerships with AI labs for wholesale pricing
2. **Live Preview Environment**

   - Real-time code preview
   - Instant feedback during development

3. **Integrated Database**

   - PostgreSQL database
   - Partnership with database providers

4. **Object Storage**

   - S3-compatible storage
   - Files, images, and assets

5. **Authentication**

   - Built-in auth with social logins
   - User management

6. **Hosting & Deployment**

   - One-click deployment
   - Global CDN
   - Partnership with hosting providers

7. **Additional Features**
   - Import from Figma
   - Import from GitHub
   - Backend logic & API endpoints
   - Real-time features

## Pricing Plans

### Hobby Plan (Free)

**Price:** Free forever
**Billing:** Top-up credits before use
**Starting Credits:** $5 free on signup

**AI Models:**

- Limited to lite models only:
  - GPT-4o mini
  - Claude 3.5 Haiku
  - Gemini 1.5 Flash

**Features:**

- ✅ AI chat & live preview
- ✅ Up to 3 projects
- ✅ Import from Figma & GitHub
- ❌ Premium AI models
- ❌ Unlimited projects
- ❌ Custom domains
- ❌ Priority support

**Service Limits & Pricing:**

- **Database:** 500MB free, then $0.10/GB/month
- **Storage:** 1GB free, then $0.05/GB/month
- **Authentication:** 1,000 MAU free, then $0.01/user
- **Hosting:** 100GB bandwidth free, then $0.10/GB
- **Support:** Community support

**How It Works:**

1. Sign up and get $5 free credits
2. Top up credits anytime to continue using
3. Pay only for what you use

---

### Pro Plan ($25/month)

**Price:** $25/month (monthly billing only, no yearly)
**Billing:** Monthly subscription + usage-based billing
**Included Credits:** $50/month

**AI Models:**

- **All models** including premium:
  - GPT-4
  - Claude 3.5 Sonnet
  - o1
  - Grok
  - All lite models
- Priority AI processing

**Features:**

- ✅ Everything in Hobby
- ✅ Unlimited projects
- ✅ Custom domains
- ✅ Advanced code generation
- ✅ Remove Craft branding
- ✅ Email support

**Service Limits & Pricing:**

- **Database:** 5GB free, then $0.08/GB/month
- **Storage:** 10GB free, then $0.04/GB/month
- **Authentication:** 10,000 MAU free, then $0.008/user
- **Hosting:** 500GB bandwidth free, then $0.08/GB
- **Support:** Email support

**How It Works:**

1. Pay $25/month subscription
2. Get $50 included credits
3. Usage beyond included credits billed at month-end
4. Receive usage alerts before charges apply

---

### Enterprise Plan (Custom)

**Price:** Custom pricing
**Billing:** Custom arrangements
**Credits:** Custom allocations

**Features:**

- ✅ Everything in Pro
- ✅ Custom pricing & volume discounts
- ✅ Dedicated AI model instances
- ✅ SSO & SAML authentication
- ✅ Team collaboration tools
- ✅ Advanced security controls
- ✅ Audit logs & compliance
- ✅ Opt-out of AI training
- ✅ Custom database & storage limits
- ✅ 99.9% uptime SLA
- ✅ Dedicated account manager
- ✅ 24/7 priority support
- ✅ Onboarding & training
- ✅ Custom integrations

**Contact:** sales@craft.tech

---

## Key Principles

### 1. Simple & Transparent

- **No yearly plans** - Keep it simple with monthly only
- Clear pricing for all services
- No hidden fees

### 2. Pay-as-you-go

- **Hobby:** Top-up before use
- **Pro:** Monthly billing based on usage
- Only pay for what you use after free limits

### 3. Partnership Model

- Direct partnerships with AI labs for wholesale AI pricing
- Partnerships with hosting providers
- Partnerships with database providers
- Pass savings to customers through competitive rates

### 4. Centralized Billing

- One platform, one bill
- No need to manage multiple service providers
- Transparent usage tracking

### 5. Free Tier Philosophy

- Generous free limits on all services
- $5 free credits on Hobby signup
- $50 included credits with Pro subscription
- Enable learning and experimentation

---

## Competitive Advantages

1. **All-in-one platform:** No need to cobble together multiple services
2. **Partner pricing:** Direct relationships with providers = better rates
3. **Simple billing:** One bill for everything
4. **Free to start:** $5 credits, no credit card required
5. **Scale as you grow:** Clear path from hobby to production
6. **Multiple AI models:** Choose the best model for each task
7. **Integrated workflow:** From Figma/GitHub to deployed app

---

## FAQ Highlights

**Q: What services are included?**
A: Everything - AI chat, live preview, database, storage, auth, and deployment. All with free usage limits.

**Q: How does billing work?**
A: Hobby = top-up credits. Pro = $25/month + usage billing. Simple and transparent.

**Q: Which AI models can I use?**
A: Hobby = lite models. Pro = all models including premium with priority processing.

**Q: What are free limits?**
A: Generous tiers for all services. Database (500MB-5GB), Storage (1GB-10GB), Auth (1K-10K MAU), Hosting (100GB-500GB bandwidth).

**Q: Why so competitive?**
A: Direct partnerships with providers = wholesale rates = savings passed to you.

**Q: Is there a yearly plan?**
A: No, monthly only. Pro is $25/month with flexible pay-as-you-go. Cancel anytime.

---

## Implementation Notes

### Updated Files

- `src/app/pricing/page.tsx` - Main pricing page
- Removed billing period toggle (yearly/monthly)
- Updated plan features to show all services
- Added "What's Included" section showcasing all services
- Updated FAQ to reflect new model
- Clear display of free limits and pricing

### Next Steps

1. ✅ Update pricing page UI
2. ⏳ Implement credit system in backend
3. ⏳ Add top-up functionality for Hobby users
4. ⏳ Implement usage tracking for all services
5. ⏳ Add usage alerts and notifications
6. ⏳ Create billing dashboard
7. ⏳ Set up partnerships with providers

---

Last Updated: October 13, 2025
