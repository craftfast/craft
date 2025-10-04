import Logo from "@/components/Logo";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Craft",
  description:
    "Craft's Terms of Service - Read our terms and conditions for using the platform.",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <div className="relative flex items-center justify-between">
            <Logo iconClassName="text-white dark:text-white" href="/" />
            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            Last updated: October 4, 2025
          </p>

          <div className="bg-stone-50 dark:bg-neutral-900 rounded-xl p-6 mb-8">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-0">
              These Terms of Service (&quot;Terms&quot;) govern your access to
              and use of Craft.tech and the Craft application, operated by
              Nextcrafter Labs (OPC) Private Limited (&quot;Craft,&quot;
              &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), including our
              website, platform, AI services, and related applications
              (collectively, the &quot;Services&quot;). By accessing or using
              our Services, you agree to be bound by these Terms.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>

            <p className="mb-3">
              By creating an account, accessing, or using Craft, you agree to:
            </p>
            <ul className="space-y-2">
              <li>
                Be bound by these Terms and our{" "}
                <Link
                  href="/privacy"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>Comply with all applicable laws and regulations</li>
              <li>
                Be at least 13 years old (or 16 in the EU), or have parental
                consent
              </li>
              <li>Provide accurate and complete information</li>
            </ul>
            <p className="mt-3">
              If you do not agree to these Terms, do not use our Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. Account Registration and Security
            </h2>

            <h3 className="text-xl font-semibold mb-3">2.1 Account Creation</h3>
            <ul className="space-y-2">
              <li>
                You must provide a valid email address and create a secure
                password
              </li>
              <li>
                You are responsible for maintaining the confidentiality of your
                credentials
              </li>
              <li>You must notify us immediately of any unauthorized access</li>
              <li>
                One person or entity may not maintain multiple free accounts
              </li>
              <li>Accounts are non-transferable without our written consent</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              2.2 Account Responsibility
            </h3>
            <p>
              You are responsible for all activities that occur under your
              account, including:
            </p>
            <ul className="space-y-2">
              <li>Content created, uploaded, or shared</li>
              <li>Token usage and billing charges</li>
              <li>Compliance with these Terms</li>
              <li>Actions of collaborators you invite to your projects</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              3. Subscription Plans and Billing
            </h2>

            <h3 className="text-xl font-semibold mb-3">3.1 Plan Types</h3>
            <div className="space-y-4">
              <div className="bg-stone-50 dark:bg-neutral-900 rounded-xl p-4">
                <p className="font-semibold mb-2">Free Plan</p>
                <ul className="space-y-1 text-sm">
                  <li>• No monthly fee</li>
                  <li>• Pay-as-you-go: $20 per 1 million tokens</li>
                  <li>• 0.5GB database storage</li>
                  <li>• Unlimited projects</li>
                  <li>• Use your own API keys</li>
                  <li>• Community support</li>
                </ul>
              </div>

              <div className="bg-stone-50 dark:bg-neutral-900 rounded-xl p-4">
                <p className="font-semibold mb-2">Premium Plan</p>
                <ul className="space-y-1 text-sm">
                  <li>• $500/month (or ₹41,500/month)</li>
                  <li>• 1 million tokens per day (30M per month)</li>
                  <li>• 10GB database storage</li>
                  <li>• Unlimited projects</li>
                  <li>• Priority support</li>
                  <li>• Advanced AI features</li>
                  <li>• Human oversight</li>
                  <li>• Extended memory</li>
                </ul>
              </div>

              <div className="bg-stone-50 dark:bg-neutral-900 rounded-xl p-4">
                <p className="font-semibold mb-2">Enterprise Plan</p>
                <ul className="space-y-1 text-sm">
                  <li>• Custom pricing</li>
                  <li>• Unlimited tokens and storage</li>
                  <li>• Dedicated support</li>
                  <li>• SAML SSO</li>
                  <li>• Training opt-out</li>
                  <li>• Custom integrations</li>
                  <li>• SLA guarantees</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3.2 Billing and Payments
            </h3>
            <ul className="space-y-2">
              <li>
                <strong>Payment Processing:</strong> All payments are processed
                securely through Razorpay
              </li>
              <li>
                <strong>Subscription Renewals:</strong> Premium subscriptions
                auto-renew monthly unless cancelled
              </li>
              <li>
                <strong>Token Usage:</strong> Free users are billed for token
                usage at the end of each billing period
              </li>
              <li>
                <strong>Payment Methods:</strong> We accept credit cards, debit
                cards, and other methods supported by Razorpay
              </li>
              <li>
                <strong>Taxes:</strong> You are responsible for all applicable
                taxes
              </li>
              <li>
                <strong>Currency:</strong> Prices are in USD or INR as displayed
                during purchase
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3.3 Refunds and Cancellations
            </h3>
            <ul className="space-y-2">
              <li>
                <strong>Cancellation:</strong> You may cancel your subscription
                at any time. Access continues until the end of the billing
                period.
              </li>
              <li>
                <strong>Refunds:</strong> We do not offer refunds for partial
                months or unused tokens.
              </li>
              <li>
                <strong>Downgrades:</strong> Plan downgrades take effect at the
                start of the next billing cycle.
              </li>
              <li>
                <strong>Failed Payments:</strong> If payment fails, we may
                suspend your account after reasonable notice.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              4. Acceptable Use Policy
            </h2>

            <h3 className="text-xl font-semibold mb-3">4.1 Permitted Uses</h3>
            <p>You may use Craft to:</p>
            <ul className="space-y-2">
              <li>Create, develop, and deploy web applications</li>
              <li>Use AI assistance for code generation and problem-solving</li>
              <li>Collaborate with team members on projects</li>
              <li>Integrate with supported third-party services</li>
              <li>Store and manage project data within your storage limits</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              4.2 Prohibited Uses
            </h3>
            <p>You may NOT use Craft to:</p>
            <ul className="space-y-2">
              <li>
                <strong>Illegal Activities:</strong> Violate laws, regulations,
                or rights of others
              </li>
              <li>
                <strong>Malicious Code:</strong> Create malware, viruses, or
                harmful software
              </li>
              <li>
                <strong>Unauthorized Access:</strong> Attempt to breach security
                or access others&apos; accounts
              </li>
              <li>
                <strong>Abuse:</strong> Harass, threaten, or harm others
              </li>
              <li>
                <strong>Spam:</strong> Send unsolicited messages or
                communications
              </li>
              <li>
                <strong>Scraping:</strong> Automate access to extract data
                without permission
              </li>
              <li>
                <strong>Resource Abuse:</strong> Excessively consume resources
                or interfere with service availability
              </li>
              <li>
                <strong>Reverse Engineering:</strong> Attempt to reverse
                engineer, decompile, or discover source code
              </li>
              <li>
                <strong>Impersonation:</strong> Impersonate Craft, our
                employees, or other users
              </li>
              <li>
                <strong>Prohibited Content:</strong> Create or distribute
                content that is:
                <ul className="ml-6 mt-2 space-y-1">
                  <li>- Illegal, fraudulent, or deceptive</li>
                  <li>- Hateful, discriminatory, or harassing</li>
                  <li>- Sexually explicit or exploitative</li>
                  <li>- Violating intellectual property rights</li>
                  <li>
                    - Containing personal information of others without consent
                  </li>
                </ul>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              5. Intellectual Property Rights
            </h2>

            <h3 className="text-xl font-semibold mb-3">5.1 Your Content</h3>
            <ul className="space-y-2">
              <li>
                You retain all ownership rights to content you create or upload
              </li>
              <li>
                You grant us a license to host, store, and display your content
                to provide the Services
              </li>
              <li>
                You represent that you have all necessary rights to your content
              </li>
              <li>
                You are responsible for ensuring your content does not infringe
                others&apos; rights
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              5.2 AI-Generated Content
            </h3>
            <ul className="space-y-2">
              <li>
                AI-generated code and content are provided to you without
                restriction
              </li>
              <li>
                You are solely responsible for reviewing and validating AI
                output
              </li>
              <li>
                AI output may not be unique; similar output may be provided to
                other users
              </li>
              <li>
                We make no warranties about AI-generated content&apos;s
                accuracy, quality, or fitness
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              5.3 Craft&apos;s Intellectual Property
            </h3>
            <p>The Craft platform, including our:</p>
            <ul className="space-y-2">
              <li>Software, algorithms, and AI models</li>
              <li>Website design, logos, and branding</li>
              <li>Documentation and user interfaces</li>
              <li>Trademarks and service marks</li>
            </ul>
            <p className="mt-2">
              are owned by Craft and protected by intellectual property laws.
              You may not copy, modify, or create derivative works without our
              written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. AI Services and Limitations
            </h2>

            <h3 className="text-xl font-semibold mb-3">6.1 AI Assistance</h3>
            <ul className="space-y-2">
              <li>Our AI provides code suggestions, answers, and assistance</li>
              <li>
                AI output is not guaranteed to be accurate, secure, or optimal
              </li>
              <li>You must review and test all AI-generated code before use</li>
              <li>
                We are not liable for errors, bugs, or security issues in AI
                output
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              6.2 Token Limits and Fair Use
            </h3>
            <ul className="space-y-2">
              <li>
                <strong>Free Users:</strong> Pay $20 per 1M tokens used
              </li>
              <li>
                <strong>Premium Users:</strong> 1M tokens per day (soft limit;
                reasonable overages may be allowed)
              </li>
              <li>
                <strong>Enterprise Users:</strong> Custom limits based on
                agreement
              </li>
              <li>
                We reserve the right to implement rate limits to ensure fair use
              </li>
              <li>
                Excessive usage may result in temporary throttling or account
                review
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.3 AI Training</h3>
            <ul className="space-y-2">
              <li>
                <strong>Free and Premium:</strong> Your prompts may be used to
                improve AI models
              </li>
              <li>
                <strong>Enterprise:</strong> Can opt out of AI training
              </li>
              <li>
                We implement privacy-preserving techniques when training models
              </li>
              <li>Sensitive data should not be included in prompts</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data and Storage</h2>

            <h3 className="text-xl font-semibold mb-3">7.1 Storage Limits</h3>
            <ul className="space-y-2">
              <li>
                <strong>Free:</strong> 0.5GB database storage
              </li>
              <li>
                <strong>Premium:</strong> 10GB database storage
              </li>
              <li>
                <strong>Enterprise:</strong> Unlimited storage
              </li>
              <li>
                Exceeding storage limits may result in service interruption
              </li>
              <li>
                We may delete data exceeding limits after reasonable notice
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              7.2 Data Backups
            </h3>
            <ul className="space-y-2">
              <li>You are responsible for backing up your data</li>
              <li>
                We perform regular backups but do not guarantee data recovery
              </li>
              <li>Premium and Enterprise users have enhanced backup options</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              7.3 Data Deletion
            </h3>
            <ul className="space-y-2">
              <li>You can delete projects and data at any time</li>
              <li>Account deletion requests are processed within 30 days</li>
              <li>
                Some data may be retained as required by law or for legitimate
                business purposes
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              8. Third-Party Integrations
            </h2>

            <p className="mb-3">
              Craft integrates with third-party services including:
            </p>
            <ul className="space-y-2">
              <li>
                <strong>GitHub:</strong> Repository sync and version control
              </li>
              <li>
                <strong>Vercel:</strong> Deployment and hosting
              </li>
              <li>
                <strong>Figma:</strong> Design imports
              </li>
              <li>
                <strong>Razorpay:</strong> Payment processing
              </li>
            </ul>

            <p className="mt-4">When you use these integrations:</p>
            <ul className="space-y-2">
              <li>
                You are subject to their respective terms and privacy policies
              </li>
              <li>
                We are not responsible for their services, availability, or
                security
              </li>
              <li>
                You grant necessary permissions for integration functionality
              </li>
              <li>You can revoke integration access at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              9. Service Availability and Support
            </h2>

            <h3 className="text-xl font-semibold mb-3">9.1 Service Level</h3>
            <ul className="space-y-2">
              <li>
                We strive for 99.9% uptime but do not guarantee uninterrupted
                service
              </li>
              <li>
                Scheduled maintenance will be announced in advance when possible
              </li>
              <li>
                We may modify, suspend, or discontinue features with notice
              </li>
              <li>Enterprise users may have specific SLA guarantees</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">9.2 Support</h3>
            <ul className="space-y-2">
              <li>
                <strong>Free:</strong> Community support via forums and
                documentation
              </li>
              <li>
                <strong>Premium:</strong> Priority email support with 24-hour
                response time
              </li>
              <li>
                <strong>Enterprise:</strong> Dedicated support with custom SLA
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              10. Disclaimers and Warranties
            </h2>

            <div className="bg-stone-50 dark:bg-neutral-900 rounded-xl p-6">
              <p className="font-semibold mb-3">
                SERVICES ARE PROVIDED &quot;AS IS&quot;
              </p>
              <p className="text-sm mb-3">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRAFT DISCLAIMS ALL
                WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                NON-INFRINGEMENT.
              </p>
              <p className="text-sm mb-3">WE DO NOT WARRANT THAT:</p>
              <ul className="text-sm space-y-1">
                <li>
                  • The Services will be uninterrupted, secure, or error-free
                </li>
                <li>
                  • AI output will be accurate, reliable, or suitable for your
                  purposes
                </li>
                <li>• Defects will be corrected</li>
                <li>• The Services will meet your requirements</li>
                <li>• Data will be backed up or recoverable</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              11. Limitation of Liability
            </h2>

            <div className="bg-stone-50 dark:bg-neutral-900 rounded-xl p-6">
              <p className="text-sm mb-3">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRAFT SHALL NOT BE
                LIABLE FOR:
              </p>
              <ul className="text-sm space-y-2">
                <li>
                  • Indirect, incidental, special, consequential, or punitive
                  damages
                </li>
                <li>
                  • Loss of profits, revenue, data, or business opportunities
                </li>
                <li>• Errors or inaccuracies in AI-generated content</li>
                <li>• Unauthorized access to your account or data</li>
                <li>• Actions of third-party services or integrations</li>
                <li>• Service interruptions or data loss</li>
              </ul>
              <p className="text-sm mt-4">
                <strong>
                  OUR TOTAL LIABILITY IS LIMITED TO THE AMOUNT YOU PAID US IN
                  THE 12 MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS
                  GREATER.
                </strong>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>

            <p>
              You agree to indemnify, defend, and hold harmless Craft, its
              officers, directors, employees, and agents from any claims,
              damages, losses, liabilities, and expenses (including legal fees)
              arising from:
            </p>
            <ul className="space-y-2">
              <li>Your use of the Services</li>
              <li>Your content or projects</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any laws or rights of others</li>
              <li>Your AI prompts or generated content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Termination</h2>

            <h3 className="text-xl font-semibold mb-3">13.1 By You</h3>
            <p>You may terminate your account at any time by:</p>
            <ul className="space-y-2">
              <li>Using the account deletion feature in settings</li>
              <li>Contacting support@craft.tech</li>
              <li>
                Cancelling your subscription (access continues until period end)
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">13.2 By Us</h3>
            <p>We may suspend or terminate your account if:</p>
            <ul className="space-y-2">
              <li>You violate these Terms or our policies</li>
              <li>Your account is inactive for 12+ months (with notice)</li>
              <li>Payment fails or is disputed</li>
              <li>Required by law or legal process</li>
              <li>We discontinue the Services (with reasonable notice)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              13.3 Effects of Termination
            </h3>
            <ul className="space-y-2">
              <li>Your access to the Services will cease</li>
              <li>Your data may be deleted after a grace period</li>
              <li>You remain liable for charges incurred before termination</li>
              <li>
                Provisions that should survive (IP, liability, etc.) remain in
                effect
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              14. Dispute Resolution
            </h2>

            <h3 className="text-xl font-semibold mb-3">
              14.1 Informal Resolution
            </h3>
            <p>
              Before filing a claim, you agree to contact us at legal@craft.tech
              to attempt informal resolution.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              14.2 Arbitration
            </h3>
            <p>
              Any disputes will be resolved through binding arbitration rather
              than in court, except you may assert claims in small claims court
              if they qualify.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              14.3 Class Action Waiver
            </h3>
            <p>
              You agree to bring claims only in your individual capacity, not as
              part of a class action or representative proceeding.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              14.4 Governing Law
            </h3>
            <p>
              These Terms are governed by the laws of [Your Jurisdiction],
              without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              15. Changes to Terms
            </h2>

            <p>We may modify these Terms at any time. We will:</p>
            <ul className="space-y-2">
              <li>Update the &quot;Last updated&quot; date</li>
              <li>Notify you via email for material changes</li>
              <li>
                Provide notice at least 30 days before changes take effect
              </li>
              <li>Post changes on our website</li>
            </ul>
            <p className="mt-3">
              Your continued use after changes become effective constitutes
              acceptance. If you disagree with changes, you must stop using the
              Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              16. General Provisions
            </h2>

            <h3 className="text-xl font-semibold mb-3">
              16.1 Entire Agreement
            </h3>
            <p>
              These Terms, together with our Privacy Policy, constitute the
              entire agreement between you and Craft.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              16.2 Severability
            </h3>
            <p>
              If any provision is found invalid, the remaining provisions remain
              in effect.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">16.3 No Waiver</h3>
            <p>
              Our failure to enforce any right or provision does not constitute
              a waiver.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">16.4 Assignment</h3>
            <p>
              You may not assign these Terms without our consent. We may assign
              them without restriction.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              16.5 Force Majeure
            </h3>
            <p>
              We are not liable for delays or failures due to circumstances
              beyond our reasonable control.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              17. Contact Information
            </h2>

            <p className="mb-3">
              For questions about these Terms, please contact us:
            </p>

            <div className="bg-stone-50 dark:bg-neutral-900 rounded-xl p-6">
              <p className="mb-2">
                <strong>Nextcrafter Labs (OPC) Private Limited</strong>
              </p>
              <p className="mb-1">Bangalore, India</p>
              <p className="mb-3 text-sm">Operating: Craft.tech & Craft App</p>
              <p className="mb-1">
                Email:{" "}
                <a
                  href="mailto:legal@craft.tech"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  legal@craft.tech
                </a>
              </p>
              <p className="mb-1">
                Support:{" "}
                <a
                  href="mailto:support@craft.tech"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  support@craft.tech
                </a>
              </p>
              <p className="mb-1">
                General Inquiries:{" "}
                <a
                  href="mailto:hello@craft.tech"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  hello@craft.tech
                </a>
              </p>
            </div>
          </section>

          <div className="bg-stone-50 dark:bg-neutral-900 rounded-xl p-6 mt-8">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-0">
              By using Craft, you acknowledge that you have read, understood,
              and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
