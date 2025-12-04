"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface GeneralTabProps {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  chatPosition: "left" | "right";
  setChatPosition: (position: "left" | "right") => void;
  suggestionsEnabled: boolean;
  setSuggestionsEnabled: (enabled: boolean) => void;
  soundNotifications: boolean;
  setSoundNotifications: (enabled: boolean) => void;
}

export default function GeneralTab({
  theme,
  setTheme,
  chatPosition,
  setChatPosition,
  suggestionsEnabled,
  setSuggestionsEnabled,
  soundNotifications,
  setSoundNotifications,
}: GeneralTabProps) {
  return (
    <div className="space-y-6">
      <div className="">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Appearance
        </h3>
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground mb-3">
              Theme Preference
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Choose your preferred color theme. Dark mode is the default.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => setTheme("light")}
                variant={theme === "light" ? "default" : "outline"}
                className="flex flex-col h-auto gap-2 p-4 rounded-xl"
              >
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
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="text-sm font-medium">Light</span>
              </Button>

              <Button
                onClick={() => setTheme("dark")}
                variant={theme === "dark" ? "default" : "outline"}
                className="flex flex-col h-auto gap-2 p-4 rounded-xl"
              >
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
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
                <span className="text-sm font-medium">Dark</span>
              </Button>

              <Button
                onClick={() => setTheme("system")}
                variant={theme === "system" ? "default" : "outline"}
                className="flex flex-col h-auto gap-2 p-4 rounded-xl"
              >
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
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-medium">System</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Chat Position
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose which side of the screen the chat is on.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => setChatPosition("left")}
            variant={chatPosition === "left" ? "default" : "outline"}
            className="flex-1 rounded-xl"
          >
            Left
          </Button>
          <Button
            onClick={() => setChatPosition("right")}
            variant={chatPosition === "right" ? "default" : "outline"}
            className="flex-1 rounded-xl"
          >
            Right
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Suggestions
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get relevant in-chat suggestions to refine your project.
            </p>
          </div>
          <Switch
            checked={suggestionsEnabled}
            onCheckedChange={setSuggestionsEnabled}
          />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Sound Notifications
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              A new sound will play when Craft is finished responding and the
              window is not focused.
            </p>
          </div>
          <Switch
            checked={soundNotifications}
            onCheckedChange={setSoundNotifications}
          />
        </div>
      </div>
    </div>
  );
}
