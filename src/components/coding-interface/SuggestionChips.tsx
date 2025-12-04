"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles } from "lucide-react";

interface SuggestionChipsProps {
  lastAssistantMessage: string;
  projectDescription?: string;
  fileChanges?: Array<{ path: string; type: string }>;
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}

// Context-aware suggestion generation
function generateSuggestions(
  lastMessage: string,
  projectDescription?: string,
  fileChanges?: Array<{ path: string; type: string }>
): string[] {
  const suggestions: string[] = [];
  const messageLower = lastMessage.toLowerCase();

  // If files were created/modified, suggest related actions
  if (fileChanges && fileChanges.length > 0) {
    const hasStyles = fileChanges.some(
      (f) => f.path.includes(".css") || f.path.includes("tailwind")
    );
    const hasComponents = fileChanges.some(
      (f) =>
        f.path.includes("component") ||
        f.path.includes("Component") ||
        f.path.endsWith(".tsx")
    );
    const hasApi = fileChanges.some(
      (f) => f.path.includes("/api/") || f.path.includes("route")
    );
    const hasPage = fileChanges.some(
      (f) => f.path.includes("page.") || f.path.includes("layout.")
    );

    if (hasStyles) {
      suggestions.push("Add dark mode support");
      suggestions.push("Make it more visually appealing");
    }
    if (hasComponents) {
      suggestions.push("Add animations to the components");
      suggestions.push("Make it responsive for mobile");
    }
    if (hasApi) {
      suggestions.push("Add error handling");
      suggestions.push("Add input validation");
    }
    if (hasPage) {
      suggestions.push("Add loading states");
      suggestions.push("Improve the layout design");
    }
  }

  // Content-based suggestions
  if (
    messageLower.includes("created") ||
    messageLower.includes("implemented")
  ) {
    suggestions.push("Add more features");
    suggestions.push("Improve the design");
    suggestions.push("Add tests");
  }

  if (messageLower.includes("error") || messageLower.includes("issue")) {
    suggestions.push("Explain what went wrong");
    suggestions.push("Try a different approach");
  }

  if (messageLower.includes("form") || messageLower.includes("input")) {
    suggestions.push("Add form validation");
    suggestions.push("Add a submit confirmation");
  }

  if (messageLower.includes("button") || messageLower.includes("click")) {
    suggestions.push("Add hover effects");
    suggestions.push("Add loading state on click");
  }

  if (messageLower.includes("table") || messageLower.includes("list")) {
    suggestions.push("Add sorting functionality");
    suggestions.push("Add search/filter");
    suggestions.push("Add pagination");
  }

  if (messageLower.includes("api") || messageLower.includes("fetch")) {
    suggestions.push("Add error handling");
    suggestions.push("Add loading indicators");
    suggestions.push("Add caching");
  }

  // Generic helpful suggestions if we don't have specific ones
  if (suggestions.length === 0) {
    suggestions.push("Improve the design");
    suggestions.push("Add more features");
    suggestions.push("Explain how it works");
  }

  // Shuffle and return max 3 suggestions
  return suggestions
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .filter((s, i, arr) => arr.indexOf(s) === i); // Remove duplicates
}

export function SuggestionChips({
  lastAssistantMessage,
  projectDescription,
  fileChanges,
  onSuggestionClick,
  isLoading,
}: SuggestionChipsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Generate suggestions when message changes
  useEffect(() => {
    if (lastAssistantMessage && !isLoading) {
      const newSuggestions = generateSuggestions(
        lastAssistantMessage,
        projectDescription,
        fileChanges
      );
      setSuggestions(newSuggestions);
      // Small delay for animation
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [lastAssistantMessage, projectDescription, fileChanges, isLoading]);

  const handleClick = useCallback(
    (suggestion: string) => {
      setIsVisible(false);
      onSuggestionClick(suggestion);
    },
    [onSuggestionClick]
  );

  if (!isVisible || suggestions.length === 0 || isLoading) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Suggestions</span>
      </div>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => handleClick(suggestion)}
          className="px-3 py-1.5 text-xs font-medium rounded-full
            bg-muted/50 hover:bg-muted border border-border
            text-muted-foreground hover:text-foreground
            transition-all duration-200 hover:scale-[1.02]
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
