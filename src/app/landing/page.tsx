import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import WaitlistForm from "@/components/WaitlistForm";
import type { Session } from "next-auth";

export default async function LandingPage() {
  const session = (await getServerSession(authOptions)) as Session | null;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <HeaderNav />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:max-w-4xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-6xl">
                Build Apps by{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-600 to-neutral-900 dark:from-neutral-400 dark:to-neutral-100">
                  Chatting with AI
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-neutral-600 dark:text-neutral-400">
                Craft is the revolutionary open-source vibecoding tool that lets
                you build apps and websites through natural conversation with
                AI.
              </p>

              {session?.user ? (
                <div className="mt-10">
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    Welcome back, {session.user.name || session.user.email}!
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-block rounded-full bg-neutral-900 dark:bg-neutral-100 px-8 py-3 text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : (
                <div className="mt-10">
                  <WaitlistForm />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-neutral-50 dark:bg-neutral-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-neutral-600 dark:text-neutral-400">
                Faster Development
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
                Everything you need to build amazing apps
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="text-base font-semibold leading-7 text-neutral-900 dark:text-neutral-100">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100">
                      <svg
                        className="h-6 w-6 text-white dark:text-neutral-900"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                        />
                      </svg>
                    </div>
                    AI-Powered Development
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-neutral-600 dark:text-neutral-400">
                    <p className="flex-auto">
                      Chat with AI to generate code, fix bugs, and build
                      features faster than ever before.
                    </p>
                  </dd>
                </div>

                <div className="flex flex-col">
                  <dt className="text-base font-semibold leading-7 text-neutral-900 dark:text-neutral-100">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100">
                      <svg
                        className="h-6 w-6 text-white dark:text-neutral-900"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                        />
                      </svg>
                    </div>
                    Lightning Fast
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-neutral-600 dark:text-neutral-400">
                    <p className="flex-auto">
                      Built on Next.js 15 with Turbopack for blazing fast
                      development and production builds.
                    </p>
                  </dd>
                </div>

                <div className="flex flex-col">
                  <dt className="text-base font-semibold leading-7 text-neutral-900 dark:text-neutral-100">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100">
                      <svg
                        className="h-6 w-6 text-white dark:text-neutral-900"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                        />
                      </svg>
                    </div>
                    Open Source
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-neutral-600 dark:text-neutral-400">
                    <p className="flex-auto">
                      Fully open source and transparent. Build with confidence
                      knowing the code is yours.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
