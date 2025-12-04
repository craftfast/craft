"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useChatPosition } from "@/contexts/ChatPositionContext";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { GeneralTab } from "@/components/settings";

export default function GeneralSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { chatPosition, setChatPosition } = useChatPosition();
  const {
    suggestionsEnabled,
    setSuggestionsEnabled,
    soundNotifications,
    setSoundNotifications,
  } = useUserSettings();

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold">General</h2>
      </div>
      <GeneralTab
        theme={theme}
        setTheme={setTheme}
        chatPosition={chatPosition}
        setChatPosition={setChatPosition}
        suggestionsEnabled={suggestionsEnabled}
        setSuggestionsEnabled={setSuggestionsEnabled}
        soundNotifications={soundNotifications}
        setSoundNotifications={setSoundNotifications}
      />
    </div>
  );
}
