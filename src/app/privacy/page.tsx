import Logo from "@/components/Logo";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Craft",
  description:
    "Craft's Privacy Policy - Learn how we collect, use, and protect your data.",
};

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            Last updated: October 4, 2025
          </p>

          <div className="bg-stone-50 dark:bg-neutral-900 rounded-xl p-6 mb-8">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-0">
              This Privacy Policy describes how Nextcrafter Labs (OPC) Private
              Limited, operating Craft.tech and the Craft application
              (&quot;Craft,&quot; &quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) collects, uses, and shares your personal
              information when you use our AI-powered development platform and
              related services.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              1. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold mb-3">
              1.1 Information You Provide
            </h3>
            <ul className="space-y-2">
              <li>
                <strong>Account Information:</strong> Email address, username,
                and password when you create an account.
              </li>
              <li>
                <strong>Payment Information:</strong> Billing details, payment
                card information (processed securely through Razorpay), and
                transaction history for Premium and Enterprise subscriptions.
              </li>
              <li>
                <strong>Profile Information:</strong> Optional information such
                as name, profile picture, and preferences.
              </li>
              <li>
                <strong>Communications:</strong> Information you provide when
                you contact our support team or participate in surveys.
              </li>
              <li>
                <strong>Waitlist Data:</strong> Email addresses submitted
                through our waitlist form.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              1.2 Information We Collect Automatically
            </h3>
            <ul className="space-y-2">
              <li>
                <strong>Usage Data:</strong> Information about how you interact
                with our platform, including features used, projects created,
                and time spent.
              </li>
              <li>
                <strong>Device Information:</strong> IP address, browser type,
                operating system, device identifiers, and language preferences.
              </li>
              <li>
                <strong>Cookies and Similar Technologies:</strong> We use
                cookies, web beacons, and similar tracking technologies to
                enhance your experience.
              </li>
              <li>
                <strong>Analytics Data:</strong> We use Vercel Analytics and
                Speed Insights to collect performance and usage metrics.
              </li>
              <li>
                <strong>Log Data:</strong> Server logs, error reports, and
                diagnostic information.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              1.3 Content and Code Data
            </h3>
            <ul className="space-y-2">
              <li>
                <strong>Projects and Code:</strong> All code, files, and
                projects you create or upload to our platform.
              </li>
              <li>
                <strong>AI Prompts and Conversations:</strong> Your interactions
                with our AI assistant, including prompts, questions, and
                generated responses.
              </li>
              <li>
                <strong>Database Content:</strong> Data stored in your Craft
                databases (up to 0.5GB for Free users, 10GB for Premium users).
              </li>
              <li>
                <strong>Integrations:</strong> Data from connected services like
                GitHub, Figma, and Vercel.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. How We Use Your Information
            </h2>

            <p className="mb-3">We use the information we collect to:</p>
            <ul className="space-y-2">
              <li>
                <strong>Provide and Improve Services:</strong> Operate,
                maintain, and enhance our platform and AI capabilities.
              </li>
              <li>
                <strong>Personalization:</strong> Customize your experience
                based on your usage patterns and preferences.
              </li>
              <li>
                <strong>AI Training:</strong> For Free and Premium users, we may
                use your prompts and interactions to improve our AI models.
                Enterprise users can opt out of AI training.
              </li>
              <li>
                <strong>User Memory:</strong> Store context and preferences to
                provide better assistance over time (limited for Free users,
                extended for Premium, unlimited for Enterprise).
              </li>
              <li>
                <strong>Process Payments:</strong> Handle billing,
                subscriptions, and token usage for Premium and Enterprise plans.
              </li>
              <li>
                <strong>Communication:</strong> Send service updates, security
                alerts, and support messages.
              </li>
              <li>
                <strong>Security:</strong> Detect, prevent, and respond to
                fraud, abuse, security risks, and technical issues.
              </li>
              <li>
                <strong>Analytics:</strong> Understand usage patterns and
                improve platform performance.
              </li>
              <li>
                <strong>Legal Compliance:</strong> Comply with legal obligations
                and enforce our Terms of Service.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              3. How We Share Your Information
            </h2>

            <p className="mb-3">
              We may share your information in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold mb-3">
              3.1 Service Providers
            </h3>
            <ul className="space-y-2">
              <li>
                <strong>Payment Processors:</strong> Razorpay for payment
                processing (they have their own privacy policies).
              </li>
              <li>
                <strong>Cloud Infrastructure:</strong> Vercel for hosting and
                deployment services.
              </li>
              <li>
                <strong>AI Services:</strong> Third-party AI model providers for
                natural language processing and code generation.
              </li>
              <li>
                <strong>Analytics Providers:</strong> Vercel Analytics for usage
                statistics and performance monitoring.
              </li>
              <li>
                <strong>Database Services:</strong> PostgreSQL hosting providers
                for data storage.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3.2 Legal Requirements
            </h3>
            <p>
              We may disclose your information if required by law, subpoena, or
              legal process, or to protect our rights, users, or the public.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3.3 Business Transfers
            </h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your
              information may be transferred to the acquiring entity.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3.4 With Your Consent
            </h3>
            <p>
              We may share your information with third parties when you
              explicitly consent or direct us to do so.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3.5 Public Projects
            </h3>
            <p>
              If you make a project public or deploy it, the associated code and
              content may be visible to others.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Retention</h2>

            <ul className="space-y-2">
              <li>
                <strong>Account Data:</strong> Retained for as long as your
                account is active or as needed to provide services.
              </li>
              <li>
                <strong>Projects and Code:</strong> Stored indefinitely unless
                you delete them or close your account.
              </li>
              <li>
                <strong>AI Conversations:</strong> May be retained for up to 30
                days (Free), 90 days (Premium), or as configured for Enterprise
                users.
              </li>
              <li>
                <strong>Payment Records:</strong> Retained for 7 years for
                accounting and tax compliance.
              </li>
              <li>
                <strong>Analytics Data:</strong> Aggregated and anonymized data
                may be retained indefinitely.
              </li>
              <li>
                <strong>Deletion:</strong> You can request deletion of your data
                by contacting support. Some data may be retained as required by
                law.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Security</h2>

            <p className="mb-3">
              We implement industry-standard security measures to protect your
              information:
            </p>
            <ul className="space-y-2">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure authentication and password hashing</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and least-privilege principles</li>
              <li>Monitoring and logging of security events</li>
              <li>Incident response and breach notification procedures</li>
            </ul>
            <p className="mt-3">
              However, no method of transmission or storage is 100% secure. We
              cannot guarantee absolute security of your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Your Rights and Choices
            </h2>

            <h3 className="text-xl font-semibold mb-3">
              6.1 Access and Portability
            </h3>
            <p>
              You can access your personal information and download your
              projects and data at any time through your account settings.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              6.2 Correction and Updates
            </h3>
            <p>
              You can update your account information, profile, and preferences
              in your account settings.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.3 Deletion</h3>
            <p>
              You can delete individual projects or your entire account. Contact
              support@craft.tech for complete data deletion.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              6.4 Opt-Out Rights
            </h3>
            <ul className="space-y-2">
              <li>
                <strong>Marketing Communications:</strong> Unsubscribe from
                promotional emails using the link in each message.
              </li>
              <li>
                <strong>Cookies:</strong> Configure your browser to refuse
                cookies, though this may limit functionality.
              </li>
              <li>
                <strong>Analytics:</strong> Premium and Enterprise users can
                request to opt out of certain analytics.
              </li>
              <li>
                <strong>AI Training:</strong> Enterprise users can opt out of
                having their data used for AI model training.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              6.5 Regional Rights
            </h3>
            <p className="mb-2">
              Depending on your location, you may have additional rights:
            </p>
            <ul className="space-y-2">
              <li>
                <strong>GDPR (EU/EEA):</strong> Right to access, rectification,
                erasure, restriction, portability, and objection.
              </li>
              <li>
                <strong>CCPA (California):</strong> Right to know, delete, and
                opt out of sale of personal information (we do not sell personal
                information).
              </li>
              <li>
                <strong>Other Jurisdictions:</strong> Rights may vary based on
                local data protection laws.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              7. Children&apos;s Privacy
            </h2>

            <p>
              Craft is not intended for users under 13 years of age (or 16 in
              the EU). We do not knowingly collect personal information from
              children. If we learn that we have collected information from a
              child, we will delete it. If you believe a child has provided us
              with personal information, please contact us at
              privacy@craft.tech.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              8. International Data Transfers
            </h2>

            <p>
              Craft operates globally and may transfer your information to
              countries outside your residence, including the United States.
              These countries may have different data protection laws. We use
              appropriate safeguards, including standard contractual clauses, to
              protect your information during international transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              9. Third-Party Links and Services
            </h2>

            <p>
              Our platform may contain links to third-party websites and
              integrate with external services (GitHub, Figma, Vercel, etc.). We
              are not responsible for the privacy practices of these third
              parties. We encourage you to review their privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              10. AI-Specific Privacy Considerations
            </h2>

            <h3 className="text-xl font-semibold mb-3">
              10.1 AI Model Training
            </h3>
            <ul className="space-y-2">
              <li>
                <strong>Free Users:</strong> Your prompts and interactions may
                be used to improve AI models.
              </li>
              <li>
                <strong>Premium Users:</strong> Your data may be used for model
                improvement with enhanced privacy controls.
              </li>
              <li>
                <strong>Enterprise Users:</strong> Can opt out of AI training
                entirely.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              10.2 AI-Generated Content
            </h3>
            <p>
              AI-generated code and content are provided &quot;as is.&quot; We
              do not claim ownership of AI-generated output, but you are
              responsible for reviewing and validating all AI suggestions before
              use.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              10.3 Context and Memory
            </h3>
            <p>
              Our AI uses context from your previous interactions to provide
              better assistance. This memory is stored securely and subject to
              retention periods based on your plan.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              11. Token Usage and Billing
            </h2>

            <p className="mb-3">For users on paid plans or pay-as-you-go:</p>
            <ul className="space-y-2">
              <li>We track token usage for billing purposes</li>
              <li>
                Usage data is retained for accounting and dispute resolution
              </li>
              <li>Premium users receive 1M tokens per day (30M per month)</li>
              <li>Free users can purchase tokens at $20 per 1M tokens</li>
              <li>
                Detailed usage logs are available in your account dashboard
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              12. Changes to This Privacy Policy
            </h2>

            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of material changes by posting the new policy on our
              website and updating the &quot;Last updated&quot; date. For
              significant changes, we may provide additional notice (such as
              email notification). Your continued use of Craft after changes
              become effective constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>

            <p className="mb-3">
              If you have questions, concerns, or requests regarding this
              Privacy Policy or our privacy practices, please contact us:
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
                  href="mailto:privacy@craft.tech"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  privacy@craft.tech
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
                Data Protection Officer:{" "}
                <a
                  href="mailto:dpo@craft.tech"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  dpo@craft.tech
                </a>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              14. Additional Resources
            </h2>

            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <a
                  href="https://www.razorpay.com/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  Razorpay Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  Vercel Privacy Policy
                </a>
              </li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
