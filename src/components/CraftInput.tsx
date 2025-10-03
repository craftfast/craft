"use client";

import { useState, useEffect } from "react";

// Example prompts to cycle through
const examplePrompts = [
  "Create a modern landing page for my startup...",
  "Design a mobile app for fitness tracking...",
  "Build a dashboard with analytics charts...",
  "Generate a portfolio website template...",
  "Make a responsive e-commerce layout...",
  "Create a blog theme with dark mode...",
  "Design an admin panel interface...",
  "Build a social media app layout...",
  "Create a restaurant booking system...",
  "Design a music streaming interface...",
  "Build a task management application...",
  "Generate a weather app design...",
];

export default function CraftInput() {
  const [input, setInput] = useState("");
  const [placeholderText, setPlaceholderText] = useState("");

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;
    let typeIntervalId: NodeJS.Timeout;
    let eraseIntervalId: NodeJS.Timeout;
    let currentText = "";

    const typeText = (text: string, callback?: () => void) => {
      let charIndex = 0;
      currentText = "";
      setPlaceholderText("");

      typeIntervalId = setInterval(() => {
        if (charIndex < text.length) {
          currentText = text.substring(0, charIndex + 1);
          setPlaceholderText(currentText);
          charIndex++;
        } else {
          clearInterval(typeIntervalId);
          if (callback) {
            timeoutId = setTimeout(callback, 2000); // Wait 2 seconds before erasing
          }
        }
      }, 50); // Type each character every 50ms
    };

    const eraseText = (callback?: () => void) => {
      let charIndex = currentText.length;

      eraseIntervalId = setInterval(() => {
        if (charIndex > 0) {
          charIndex--;
          currentText = currentText.substring(0, charIndex);
          setPlaceholderText(currentText);
        } else {
          clearInterval(eraseIntervalId);
          if (callback) {
            timeoutId = setTimeout(callback, 500); // Wait 500ms before typing next
          }
        }
      }, 20); // Erase faster than typing (20ms vs 50ms for typing)
    };

    const cyclePrompts = () => {
      if (!input.trim()) {
        typeText(examplePrompts[currentIndex], () => {
          eraseText(() => {
            currentIndex = (currentIndex + 1) % examplePrompts.length;
            cyclePrompts();
          });
        });
      }
    };

    if (!input.trim()) {
      cyclePrompts();
    } else {
      setPlaceholderText("");
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (typeIntervalId) clearInterval(typeIntervalId);
      if (eraseIntervalId) clearInterval(eraseIntervalId);
    };
  }, [input]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = Math.min(target.scrollHeight, 200) + "px";
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    // TODO: Handle submit
    console.log("Crafting:", input);
  };

  const handleQuickOption = (option: string) => {
    setInput(option);
  };

  const handleFileAttachment = () => {
    // TODO: Handle file attachment
    console.log("Attach file");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-3xl px-2 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md focus-within:shadow-lg">
        {/* First row - Input */}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={handleInput}
            placeholder=""
            className="w-full p-2 rounded-t-lg bg-transparent focus:outline-none resize-none text-base sm:text-md text-foreground placeholder:text-muted min-h-[3.5rem] max-h-[200px] scrollbar-minimal"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {!input.trim() && (
            <div className="absolute inset-0 p-2 pointer-events-none flex items-start">
              <span className="text-neutral-500 dark:text-neutral-400 text-base sm:text-md leading-relaxed">
                {placeholderText}
              </span>
            </div>
          )}
        </div>

        {/* Second row - Controls */}
        <div className="flex items-center justify-between px-1 pt-2">
          <button
            onClick={handleFileAttachment}
            className="p-2 rounded-full border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            aria-label="Attach files"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>

          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="p-2 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Submit"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick options */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          or import from
        </span>
        <button
          onClick={() => handleQuickOption("Import from Figma")}
          className="px-4 py-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm text-foreground transition-colors border border-neutral-200 dark:border-neutral-700 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
            <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
            <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
            <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
            <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
          </svg>
          Figma
        </button>
        <button
          onClick={() => handleQuickOption("Import from GitHub")}
          className="px-4 py-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm text-foreground transition-colors border border-neutral-200 dark:border-neutral-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </button>
      </div>
    </div>
  );
}
