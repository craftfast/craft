# Pricing Page Update - Vercel-Inspired Design

## Overview

Updated the pricing page to match Vercel's pricing structure with **Hobby**, **Pro**, and **Enterprise** tiers while adapting it to Craft's AI-powered coding platform with usage-based pricing.

## Key Changes

### 1. **Plan Naming (Vercel-Inspired)**

- ✅ **Free** → **Hobby** - "The perfect starting place for your next project"
- ✅ **Pro** → **Pro** - "For developers building and shipping apps rapidly"
- ✅ **Business** → Removed (consolidated features into Pro)
- ✅ **Enterprise** → **Enterprise** - "Advanced capabilities and dedicated support for teams"

### 2. **Updated Messaging**

#### Hero Section

- **Old**: "Simple, transparent pricing"
- **New**: "Build faster with AI-powered development"
- **Subheading**: Emphasizes AI model choice, idea-to-production workflow, and usage-based pricing

#### Value Propositions

- Highlights ability to **choose AI models** (Claude, GPT-4, Grok, etc.)
- Emphasizes **complete workflow** from idea to published app
- Focus on **usage-based pricing** that scales

### 3. **Plan Features (Updated)**

#### **Hobby Plan** (Free)

- 20 AI credits per month
- **Choose from Claude, GPT-4, Grok, & more** ✨
- AI-powered code generation
- Live preview environment
- Up to 3 projects
- One-click Vercel deployment
- Import designs from Figma
- GitHub integration
- 500MB database storage
- Community support

#### **Pro Plan** ($25/month + usage)

- Everything in Hobby, plus:
- **Flexible credits** (100-10,000 per month)
- **Access to premium AI models** ✨
- **No daily usage limits**
- Credit rollover
- Unlimited projects
- Custom domain support
- Private repositories
- Priority AI processing
- Advanced code generation
- Remove Craft branding
- 5GB database storage
- Email support

#### **Enterprise Plan** (Custom)

- Everything in Pro, plus:
- **Custom AI credit allocation** ✨
- **Dedicated AI model instances** ✨
- SSO & SAML authentication
- Team collaboration tools
- Advanced security controls
- Audit logs & compliance
- Opt-out of AI training
- 99.9% uptime SLA
- Dedicated account manager
- Priority support (24/7)
- Onboarding & training
- Custom integrations
- Unlimited database storage

### 4. **Updated FAQ Section**

New questions tailored to AI development platform:

1. **What is a credit?**

   - Explains AI computation units
   - Different models consume different amounts
   - Simple queries vs full app generation

2. **Which AI models can I use?** ✨ NEW

   - Claude, GPT-4, Grok, and more
   - Pro users get priority access to premium models

3. **Do unused credits roll over?**

   - Pro plan: Yes, credits roll over
   - Hobby plan: Resets monthly

4. **Can I deploy to my own infrastructure?** ✨ NEW

   - All plans: One-click Vercel deployment
   - Pro/Enterprise: Custom deployment targets

5. **What happens if I downgrade?**

   - Projects remain accessible
   - Features downgraded to Hobby limits
   - Can export anytime

6. **Payment methods**

   - Credit/debit cards, UPI, net banking

7. **How does the free trial work?** ✨ NEW
   - 14-day Pro trial
   - Full feature access
   - No credit card required

### 5. **Visual Changes**

#### Grid Layout

- Changed from 4-column to **3-column grid** (matches Vercel)
- Better visual balance with fewer plans
- More space for each plan card

#### Call-to-Action Buttons

- **Hobby**: "Start Building" (emphasizes action)
- **Pro**: "Start Free Trial" (14-day trial)
- **Enterprise**: "Contact Sales"

#### Bottom CTA Section

- **Updated heading**: "Ready to ship faster?"
- **New subheading**: "Join developers building the next generation of web apps with AI"
- **Two CTA buttons**:
  1. "Start Building for Free" → Sign up
  2. "Contact Sales" → Enterprise inquiry

### 6. **Removed Elements**

- ❌ Business plan (features consolidated into Pro or Enterprise)
- ❌ Business credit selector
- ❌ Overly technical "daily limits" FAQ (simplified messaging)
- ❌ Generic refund policy FAQ (link in footer disclaimer is sufficient)

## Platform Positioning

The new pricing page emphasizes Craft as:

1. **AI Model Freedom**: Users can choose from multiple AI models
2. **End-to-End Platform**: Idea → Code → Deploy → Publish
3. **Usage-Based**: Pay for what you use, scale as needed
4. **Developer-Focused**: Built for shipping apps fast
5. **Flexible Infrastructure**: Deploy to Vercel or custom targets

## Technical Implementation

### Code Changes

- Removed `businessCredits` state variable
- Removed `handleBusinessPayment` function
- Updated `plans` array with 3 tiers
- Updated credit selector to only show for Pro plan
- Updated grid from `lg:grid-cols-4` to `lg:grid-cols-3`
- Updated all messaging and feature lists

### Maintained Features

- ✅ Credit selector for Pro plan (100-10,000 credits)
- ✅ Monthly/Yearly billing toggle
- ✅ 17% yearly discount display
- ✅ Razorpay payment integration
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Design system compliance (neutral colors, rounded elements)

## Next Steps

Consider implementing:

1. **Free Trial Badge**: Add "14-day free trial" badge to Pro plan card
2. **Model Comparison**: Add section showing different AI models and their use cases
3. **Usage Calculator**: Interactive tool to estimate credit usage
4. **Customer Testimonials**: Social proof from developers using the platform
5. **Feature Comparison Table**: Detailed side-by-side comparison
6. **ROI Calculator**: Similar to Vercel's approach for Enterprise

## Files Modified

- `src/app/pricing/page.tsx` - Complete pricing page redesign

## Notes

- All changes maintain the Craft design system (neutral colors, rounded elements)
- Follows Vercel's pricing philosophy: Simple, transparent, scalable
- Emphasizes unique value props: AI model selection, complete workflow
- Usage-based model appeals to both hobbyists and enterprises
