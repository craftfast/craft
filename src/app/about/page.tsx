import HeaderNav from "@/components/HeaderNav";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { EMAILS } from "@/lib/constants";

export const metadata = {
  title: "About - Craft",
  description:
    "Craft is building the future of AI-powered development. Our mission is to make professional-grade software creation accessible to everyone.",
};

export default function AboutPage() {
  // Core values
  const values = [
    {
      title: "Accessible",
      description:
        "We believe everyone should have access to powerful development tools, regardless of their technical background.",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Transparent",
      description:
        "From our pricing to our roadmap, we believe in radical transparency. You always know exactly what you're paying for.",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
    },
    {
      title: "Fast",
      description:
        "Speed matters. We obsess over making every interaction fast, from AI responses to live preview updates.",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: "Quality",
      description:
        "We don't compromise on quality. Every feature is built to be production-ready from day one.",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
    },
  ];

  // Team members (expandable)
  const team = [
    {
      name: "Sudheer",
      role: "Founder & CEO",
      image: "/team/sudheer.jpg",
      twitter: "https://x.com/sudheerdotai",
      twitterHandle: "@sudheerdotai",
    },
  ];

  // Key features / what makes us different
  const differentiators = [
    {
      title: "AI-First Development",
      description:
        "Unlike traditional code editors or website builders, Craft puts AI at the center of the development experience. You describe what you want, and our AI agents build it.",
    },
    {
      title: "Real Code, Real Projects",
      description:
        "We generate actual, production-ready code—not templates or low-code abstractions. Export your code anytime. No lock-in.",
    },
    {
      title: "Live Preview",
      description:
        "See your changes instantly in a live sandbox environment. Every edit, every AI generation—rendered in real-time.",
    },
    {
      title: "Multi-Model Intelligence",
      description:
        "Choose from the best AI models—Claude, GPT-5, Gemini, Grok. Use budget models for quick tasks, premium models for complex projects.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[40] bg-background/80 backdrop-blur-md">
        <div className="px-3 sm:px-4 py-2">
          <div className="relative flex items-center justify-between">
            <Logo variant="extended" className="!h-5" href="/" />
            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="py-16 sm:py-24">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
              About Craft
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Making Software Creation
              <br />
              <span className="text-neutral-500 dark:text-neutral-400">
                Accessible to Everyone
              </span>
            </h1>
          </div>

          {/* Open Letter Section */}
          <div className="prose prose-neutral dark:prose-invert max-w-none mb-20">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              An Open Letter
            </h2>

            <div className="space-y-6 text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <p>
                Building software has traditionally required years of learning,
                expensive tools, and deep technical expertise. We believe this
                needs to change.
              </p>

              <p>
                Craft was founded with a simple but ambitious mission:{" "}
                <strong className="text-foreground">
                  make professional-grade software creation accessible to
                  everyone
                </strong>
                . Whether you&apos;re an experienced developer looking to move
                faster, or someone with a great idea but limited coding
                experience, you deserve tools that work for you.
              </p>

              <p>
                We&apos;re building Craft to be the development environment of
                the future—where you can describe what you want in plain
                language, and AI agents help you build it. Not as a replacement
                for developers, but as a powerful amplifier of human creativity
                and productivity.
              </p>

              <p>
                Our approach is different from traditional low-code platforms or
                website builders.{" "}
                <strong className="text-foreground">
                  Craft generates real, production-ready code
                </strong>
                . You can export it, modify it, deploy it anywhere. No lock-in,
                no proprietary formats—just clean, modern code.
              </p>

              <p>
                We also believe in radical transparency. Our pricing shows
                exactly what providers charge—with zero markup on AI usage.
                We&apos;re building in public, listening to our community, and
                constantly improving based on real feedback.
              </p>

              <p>
                This is just the beginning. We&apos;re excited about what
                we&apos;re building and grateful for everyone who&apos;s part of
                this journey.
              </p>

              <p className="pt-4">
                <em>— The Craft Team</em>
              </p>
            </div>
          </div>

          {/* Our Vision */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Our Vision
            </h2>

            <div className="bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 sm:p-10">
              <blockquote className="text-xl sm:text-2xl font-medium text-foreground leading-relaxed">
                &ldquo;We imagine a world where building software is as natural
                as having a conversation—where the barrier between your idea and
                a working product is measured in minutes, not months.&rdquo;
              </blockquote>
            </div>
          </div>

          {/* What Makes Us Different */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              What Makes Craft Different
            </h2>

            <div className="space-y-6">
              {differentiators.map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Our Values */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Our Values
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {values.map((value, idx) => (
                <div
                  key={idx}
                  className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl"
                >
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center mb-4 text-neutral-700 dark:text-neutral-300">
                    {value.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Transparency Section */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Transparency First
            </h2>

            <div className="space-y-6 text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <p>
                We believe the best companies are built on trust. That&apos;s
                why we&apos;re committed to transparency in everything we do:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                  <svg
                    className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-foreground">
                      Transparent Pricing
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Zero markup on AI provider costs
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                  <svg
                    className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-foreground">
                      Public Roadmap
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      See what we&apos;re building next
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                  <svg
                    className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-foreground">
                      Real-Time Usage
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Track every credit spent
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                  <svg
                    className="w-5 h-5 text-neutral-600 dark:text-neutral-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-foreground">No Lock-In</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Export your code anytime
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              The Team
            </h2>

            <div className="flex flex-wrap gap-6">
              {team.map((member, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl"
                >
                  <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden flex items-center justify-center">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-neutral-500 dark:text-neutral-400">
                        {member.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {member.role}
                    </p>
                    {member.twitter && (
                      <a
                        href={member.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-foreground transition-colors mt-1"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        {member.twitterHandle ||
                          member.twitter.split("/").pop()}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact / Join Us Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Join the Community
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a
                href="https://discord.gg/YvPKxcCV"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
              >
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:underline">
                    Discord Community
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Chat with us and other builders
                  </p>
                </div>
              </a>

              <a
                href="https://x.com/craftdotfast"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
              >
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:underline">
                    Follow on X
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Updates, tips, and behind-the-scenes
                  </p>
                </div>
              </a>

              <a
                href="https://github.com/craftfast"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
              >
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:underline">
                    GitHub
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Open source contributions
                  </p>
                </div>
              </a>

              <Link
                href="/help"
                className="group flex items-center gap-4 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
              >
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:underline">
                    Contact Support
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    We&apos;re here to help
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Company Info */}
          <div className="mb-16 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Company Information
            </h3>
            <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <p>
                <strong className="text-foreground">Legal Entity:</strong>{" "}
                Nextcrafter Labs (OPC) Private Limited
              </p>
              <p>
                <strong className="text-foreground">Location:</strong> India
              </p>
              <p>
                <strong className="text-foreground">Contact:</strong>{" "}
                <a
                  href={`mailto:${EMAILS.SUPPORT}`}
                  className="text-foreground hover:underline"
                >
                  {EMAILS.SUPPORT}
                </a>
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Ready to start building?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-xl mx-auto">
              Join thousands of creators using Craft to bring their ideas to
              life. Start for free and upgrade when you&apos;re ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="px-8 py-3 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full transition-colors duration-200 font-medium"
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-3 bg-transparent border border-neutral-300 dark:border-neutral-700 text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors duration-200 font-medium"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
