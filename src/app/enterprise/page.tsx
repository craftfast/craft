import type { Metadata } from "next";
import Logo from "@/components/Logo";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Enterprise - Craft",
  description: "Enterprise solutions for teams and organizations",
};

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <div className="relative flex items-center justify-between">
            <Logo iconClassName="text-white dark:text-white" href="/" />
            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center py-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-900 dark:text-neutral-50 mb-6">
              Enterprise Solutions
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
              Powerful tools and dedicated support for teams and organizations
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="w-12 h-12 bg-neutral-900 dark:bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-neutral-50 dark:text-neutral-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                Team Management
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Advanced user management, role-based access control, and team
                collaboration features
              </p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="w-12 h-12 bg-neutral-900 dark:bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-neutral-50 dark:text-neutral-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                Enhanced Security
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                SSO integration, advanced encryption, compliance certifications,
                and security audits
              </p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="w-12 h-12 bg-neutral-900 dark:bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-neutral-50 dark:text-neutral-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                Priority Support
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Dedicated account manager, 24/7 support, and guaranteed response
                times
              </p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="w-12 h-12 bg-neutral-900 dark:bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-neutral-50 dark:text-neutral-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                Custom Integration
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                API access, custom workflows, and seamless integration with your
                existing tools
              </p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="w-12 h-12 bg-neutral-900 dark:bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-neutral-50 dark:text-neutral-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                Analytics & Insights
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Advanced analytics, custom reports, and actionable insights for
                your organization
              </p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="w-12 h-12 bg-neutral-900 dark:bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-neutral-50 dark:text-neutral-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                Customization
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Tailored solutions, custom features, and dedicated development
                resources
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-neutral-900 dark:bg-neutral-100 rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-50 dark:text-neutral-900 mb-4">
              Ready to Scale Your Business?
            </h2>
            <p className="text-lg text-neutral-300 dark:text-neutral-600 mb-8 max-w-2xl mx-auto">
              Contact our enterprise team to discuss custom solutions tailored
              to your organization&apos;s needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:enterprise@craft.tech"
                className="px-8 py-3 text-base font-medium bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                Contact Sales
              </a>
              <a
                href="#"
                className="px-8 py-3 text-base font-medium border-2 border-neutral-300 dark:border-neutral-700 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full transition-colors"
              >
                Schedule Demo
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
