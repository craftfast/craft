import WaitlistForm from "@/components/WaitlistForm";
import WaitlistCounter from "@/components/WaitlistCounter";

export default function Home() {
  return (
    <div className="h-screen bg-black text-white relative overflow-hidden flex flex-col">
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
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-white italic">
                craft
                <span className="text-sm text-white font-bold italic">.tech</span>
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="https://github.com/craftdottech/craft"
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
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
                <span>Star on GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center flex-1 min-h-0">
        <div className="text-center max-w-4xl mx-auto px-6">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            The Open Source
            <br />
            <span className="relative">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Development Tool
              </span>
              <div className="absolute -inset-2 bg-yellow-400/20 blur-lg rounded-lg -z-10"></div>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-400 mb-6 max-w-2xl mx-auto leading-relaxed">
            A simple but powerful development tool that gets the job done.
            <br />
            Build with conversation.
          </p>

          {/* Waitlist Form */}
          <div className="mb-6">
            <WaitlistForm />
          </div>

          {/* Live Count */}
          <div className="mb-4">
            <WaitlistCounter />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pt-2 pb-12 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">
            Currently in beta • Open source on{" "}
            <a
              href="https://github.com/craftdottech/craft"
              className="text-gray-400 hover:text-white underline transition-colors"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
