import Logo from "@/components/Logo";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Cancellation & Refund Policy | Craft",
  description:
    "Craft's Cancellation and Refund Policy - Learn about our refund process and cancellation terms.",
};

export default function RefundPolicy() {
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
          <h1 className="text-4xl font-bold mb-2">
            Cancellation &amp; Refund Policy
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            Last updated: October 4, 2025
          </p>

          <div className="bg-stone-50 dark:bg-neutral-900 rounded-xl p-6 mb-8">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-0">
              This Cancellation &amp; Refund Policy explains our policies
              regarding subscription cancellations and refunds for Craft
              services operated by Nextcrafter Labs (OPC) Private Limited. We
              are committed to providing fair and transparent policies in
              compliance with applicable consumer protection laws and payment
              gateway requirements.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              1. Subscription Plans Overview
            </h2>

            <h3 className="text-xl font-semibold mb-3">1.1 Free Plan</h3>
            <ul className="space-y-2">
              <li>No subscription fee or payment required</li>
              <li>
                Can be cancelled at any time without any refund implications
              </li>
              <li>Pay-as-you-go credits are non-refundable once purchased</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              1.2 Premium Plan
            </h3>
            <ul className="space-y-2">
              <li>Monthly subscription billed in advance</li>
              <li>Pricing: $500/month (USD) or ₹41,500/month (INR)</li>
              <li>Automatically renews each month unless cancelled</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              1.3 Enterprise Plan
            </h3>
            <ul className="space-y-2">
              <li>Custom pricing and terms</li>
              <li>Subject to separate Enterprise Agreement</li>
              <li>Refund terms as specified in the Enterprise Agreement</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. Cancellation Policy
            </h2>

            <h3 className="text-xl font-semibold mb-3">2.1 How to Cancel</h3>
            <p className="mb-3">
              You may cancel your subscription at any time through:
            </p>
            <ul className="space-y-2">
              <li>Your account settings dashboard</li>
              <li>
                Contacting our support team at{" "}
                <a
                  href="mailto:support@craft.tech"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  support@craft.tech
                </a>
              </li>
              <li>Writing to us at our registered office address</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              2.2 Cancellation Effective Date
            </h3>
            <ul className="space-y-2">
              <li>
                Cancellations take effect at the end of your current billing
                period
              </li>
              <li>
                You will retain access to Premium features until the end of the
                paid period
              </li>
              <li>No partial refunds are provided for unused time</li>
              <li>
                Your account will automatically downgrade to the Free plan
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              2.3 What Happens After Cancellation
            </h3>
            <ul className="space-y-2">
              <li>Your projects and data remain accessible</li>
              <li>Premium features are disabled</li>
              <li>Usage is subject to Free plan limitations</li>
              <li>You can resubscribe at any time</li>
              <li>No data is deleted from your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Refund Policy</h2>

            <h3 className="text-xl font-semibold mb-3">
              3.1 General Refund Terms
            </h3>
            <p className="mb-3">
              We strive to ensure customer satisfaction. However, due to the
              nature of our digital services:
            </p>
            <ul className="space-y-2">
              <li>
                <strong>Monthly subscriptions are non-refundable</strong> once
                the billing period begins
              </li>
              <li>
                Refunds may be considered on a case-by-case basis for
                exceptional circumstances
              </li>
              <li>
                All refund requests must be submitted within 7 days of charge
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3.2 Eligible Refund Scenarios
            </h3>
            <p className="mb-3">
              Refunds may be provided in the following situations:
            </p>
            <ul className="space-y-2">
              <li>
                <strong>Duplicate charges:</strong> If you were charged twice
                for the same subscription period
              </li>
              <li>
                <strong>Service unavailability:</strong> If our service was
                unavailable for more than 48 consecutive hours due to our fault
              </li>
              <li>
                <strong>Unauthorized charges:</strong> If a charge was made
                without your authorization (subject to verification)
              </li>
              <li>
                <strong>Technical issues:</strong> If critical features were
                non-functional and we were unable to resolve them within 7 days
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3.3 Non-Refundable Items
            </h3>
            <ul className="space-y-2">
              <li>Partial month subscriptions</li>
              <li>Pay-as-you-go token credits once purchased</li>
              <li>Subscription fees after the 7-day refund request window</li>
              <li>
                Any fees if service termination was due to Terms of Service
                violations
              </li>
              <li>Add-on services or custom integrations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3.4 How to Request a Refund
            </h3>
            <p className="mb-3">To request a refund:</p>
            <ol className="space-y-2">
              <li>
                Email{" "}
                <a
                  href="mailto:support@craft.tech"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  support@craft.tech
                </a>{" "}
                with subject line &quot;Refund Request&quot;
              </li>
              <li>Include your account email and transaction ID</li>
              <li>Explain the reason for your refund request</li>
              <li>Provide any supporting documentation if applicable</li>
            </ol>
            <p className="mt-3">
              We will respond to refund requests within 5-7 business days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              4. Payment Processing &amp; Timeline
            </h2>

            <h3 className="text-xl font-semibold mb-3">4.1 Payment Gateway</h3>
            <p className="mb-3">
              All payments are securely processed through Razorpay. We do not
              store your complete payment information on our servers.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              4.2 Refund Processing Time
            </h3>
            <ul className="space-y-2">
              <li>Approved refunds are processed within 5-10 business days</li>
              <li>
                Credit to your original payment method may take an additional
                5-7 business days depending on your bank or card issuer
              </li>
              <li>
                You will receive an email confirmation once the refund is
                processed
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              4.3 Currency &amp; Conversion
            </h3>
            <ul className="space-y-2">
              <li>Refunds are issued in the original transaction currency</li>
              <li>
                Any currency conversion fees charged by your bank are not
                refundable
              </li>
              <li>
                Exchange rate differences between charge and refund dates are
                not compensated
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Billing Disputes</h2>

            <h3 className="text-xl font-semibold mb-3">
              5.1 Dispute Resolution
            </h3>
            <p className="mb-3">
              If you believe you have been incorrectly charged:
            </p>
            <ul className="space-y-2">
              <li>
                Contact us immediately at{" "}
                <a
                  href="mailto:support@craft.tech"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  support@craft.tech
                </a>
              </li>
              <li>Do not initiate a chargeback before contacting us</li>
              <li>We will investigate and respond within 5-7 business days</li>
              <li>Most billing issues can be resolved quickly</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Chargebacks</h3>
            <p className="mb-3">Unauthorized chargebacks may result in:</p>
            <ul className="space-y-2">
              <li>Immediate suspension of your account</li>
              <li>Loss of access to all data and services</li>
              <li>Blacklisting from future use of Craft services</li>
              <li>
                Recovery of chargeback fees and legal costs where applicable
              </li>
            </ul>
            <p className="mt-3">
              We encourage you to work with us directly to resolve any billing
              concerns before initiating a chargeback.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Automatic Renewal &amp; Price Changes
            </h2>

            <h3 className="text-xl font-semibold mb-3">6.1 Auto-Renewal</h3>
            <ul className="space-y-2">
              <li>
                Premium subscriptions automatically renew monthly unless
                cancelled
              </li>
              <li>You will be charged on the same day each month</li>
              <li>Payment method on file will be charged automatically</li>
              <li>You can cancel auto-renewal at any time</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              6.2 Price Changes
            </h3>
            <ul className="space-y-2">
              <li>We reserve the right to change our pricing at any time</li>
              <li>
                Existing subscribers will receive 30 days advance notice of
                price increases
              </li>
              <li>New pricing applies to renewals after the notice period</li>
              <li>
                You may cancel your subscription before the price change takes
                effect
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              7. Enterprise &amp; Custom Agreements
            </h2>

            <p className="mb-3">
              Enterprise customers with custom agreements should refer to their
              specific contract for:
            </p>
            <ul className="space-y-2">
              <li>Custom cancellation terms</li>
              <li>Prorated refund calculations</li>
              <li>Notice periods for termination</li>
              <li>Service Level Agreement (SLA) credits</li>
            </ul>
            <p className="mt-3">
              In case of conflict between this policy and an Enterprise
              Agreement, the Enterprise Agreement takes precedence.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              8. Consumer Rights &amp; Legal Compliance
            </h2>

            <h3 className="text-xl font-semibold mb-3">8.1 India</h3>
            <p className="mb-3">
              For customers in India, this policy complies with:
            </p>
            <ul className="space-y-2">
              <li>Consumer Protection Act, 2019</li>
              <li>Information Technology Act, 2000</li>
              <li>
                RBI (Reserve Bank of India) guidelines for digital payments
              </li>
              <li>Razorpay payment gateway compliance requirements</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              8.2 International Customers
            </h3>
            <p className="mb-3">
              International customers may have additional rights under their
              local consumer protection laws, including:
            </p>
            <ul className="space-y-2">
              <li>EU customers: Rights under the Distance Selling Directive</li>
              <li>UK customers: Rights under the Consumer Rights Act 2015</li>
              <li>
                US customers: Rights under state and federal consumer protection
                laws
              </li>
            </ul>
            <p className="mt-3">
              Nothing in this policy limits your statutory consumer rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              9. Data Retention After Cancellation
            </h2>

            <ul className="space-y-2">
              <li>
                Your account data is retained for 90 days after cancellation
              </li>
              <li>
                You can reactivate your subscription during this period without
                data loss
              </li>
              <li>
                After 90 days, we may delete your data in accordance with our{" "}
                <Link
                  href="/privacy"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                You can request immediate data deletion by contacting support
              </li>
              <li>
                Some data may be retained for legal or security purposes as
                outlined in our Privacy Policy
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              10. Contact Information
            </h2>

            <p className="mb-3">
              For questions about cancellations, refunds, or billing:
            </p>

            <div className="bg-stone-50 dark:bg-neutral-900 rounded-xl p-6">
              <p className="mb-2">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:support@craft.tech"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                >
                  support@craft.tech
                </a>
              </p>
              <p className="mb-2">
                <strong>Company:</strong> Nextcrafter Labs (OPC) Private Limited
              </p>
              <p className="mb-2">
                <strong>Registered Office:</strong> [Your registered office
                address]
              </p>
              <p className="mb-0">
                <strong>Response Time:</strong> Within 5-7 business days
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              11. Changes to This Policy
            </h2>

            <p className="mb-3">
              We may update this Cancellation &amp; Refund Policy from time to
              time. Changes will be:
            </p>
            <ul className="space-y-2">
              <li>
                Posted on this page with an updated &quot;Last updated&quot;
                date
              </li>
              <li>
                Communicated to active subscribers via email for material
                changes
              </li>
              <li>
                Effective immediately for new users and after 30 days for
                existing users
              </li>
            </ul>
            <p className="mt-3">
              Continued use of our services after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
