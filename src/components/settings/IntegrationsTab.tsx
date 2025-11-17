"use client";

export default function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Connected Services
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your account with third-party services to enhance your
          workflow
        </p>
        <div className="space-y-3">
          {/* Figma */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center border border-input">
                <svg className="w-6 h-6" viewBox="0 0 38 57" fill="none">
                  <path
                    d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z"
                    fill="#1ABCFE"
                  />
                  <path
                    d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z"
                    fill="#0ACF83"
                  />
                  <path
                    d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z"
                    fill="#FF7262"
                  />
                  <path
                    d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z"
                    fill="#F24E1E"
                  />
                  <path
                    d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z"
                    fill="#A259FF"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Figma</p>
                <p className="text-xs text-muted-foreground">
                  Import designs and export code
                </p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors">
              Connect
            </button>
          </div>

          {/* GitHub */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary-foreground"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">GitHub</p>
                <p className="text-xs text-muted-foreground">
                  Deploy and manage repositories
                </p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors">
              Connect
            </button>
          </div>

          {/* Vercel */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-900 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="white"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 20h20L12 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Vercel</p>
                <p className="text-xs text-muted-foreground">
                  Deploy and host your projects
                </p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors">
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
