import WaitlistForm from "@/components/WaitlistForm";
import WaitlistCounter from "@/components/WaitlistCounter";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl sm:text-3xl font-bold text-white italic">
                craft
                <span className="text-xs sm:text-sm text-white font-bold italic">
                  .tech
                </span>
              </span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <a
                href="https://x.com/craftdottech"
                className="text-neutral-200 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com/craftdottech/craft"
                className="bg-white text-black px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-100 transition-colors flex items-center space-x-1 sm:space-x-2"
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden sm:inline">Star on GitHub</span>
                <span className="sm:hidden">Star</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center flex-1 min-h-0 py-8 sm:py-12">
        <div className="text-center max-w-4xl mx-auto px-4 sm:px-6">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            <span className="font-bold">The Open Source</span>
            <br />
            <span className="relative -tracking-wider rotate-[-1deg] sm:rotate-[-2deg] inline-block mt-2 sm:mt-0">
              <span className="text-white font-bold relative inline-block px-3 py-2 sm:px-1 sm:py-0 mt-1 border-2 border-orange-400/60 rounded-xl backdrop-blur-sm">
                Vibe Coding Tool
                {/* Decorative corner elements */}
                <div className="absolute -top-1 -left-1 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-orange-300/80 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-orange-300/80 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-orange-300/80 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-orange-300/80 rounded-br-lg"></div>
                {/* Subtle inner glow */}
                <div className="absolute inset-0 border border-orange-400/15 rounded-xl"></div>
              </span>
              <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-white/5 via-neutral-200/10 to-neutral-300/5 blur-xl rounded-lg -z-10"></div>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-400 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
            Craft beautiful apps by simply describing your vision to AI.
            <br />
            <span className="italic text-neutral-400 font-light">
              No code required. Right in your browser.
            </span>
          </p>

          {/* Waitlist Form */}
          <div className="mb-6 sm:mb-8">
            <WaitlistForm />
          </div>

          {/* Live Count */}
          <div className="mb-6 sm:mb-8">
            <WaitlistCounter />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pt-2 pb-8 sm:pb-12 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-neutral-500 text-xs sm:text-sm">
            Currently in beta • Open source on{" "}
            <a
              href="https://github.com/craftdottech/craft"
              className="text-neutral-400 hover:text-white underline transition-colors"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
