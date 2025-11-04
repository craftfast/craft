"use client";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Globe,
  Lock,
  Link2,
} from "lucide-react";

export default function ThemeDemo() {
  const { theme, resolvedTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("GPT-5");
  const [selectedVisibility, setSelectedVisibility] = useState("public");
  const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] =
    useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        visibilityRef.current &&
        !visibilityRef.current.contains(event.target as Node)
      ) {
        setIsVisibilityDropdownOpen(false);
      }
    };

    if (isDropdownOpen || isVisibilityDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isDropdownOpen, isVisibilityDropdownOpen]);

  const colorExamples = [
    {
      name: "Background",
      class: "bg-background",
      textClass: "text-foreground",
    },
    { name: "Surface", class: "bg-surface", textClass: "text-foreground" },
    {
      name: "Surface Hover",
      class: "bg-surface-hover",
      textClass: "text-foreground",
    },
    {
      name: "Foreground",
      class: "bg-foreground",
      textClass: "text-background",
    },
    { name: "Muted", class: "bg-muted", textClass: "text-background" },
    { name: "Accent", class: "bg-accent", textClass: "text-background" },
    { name: "Border", class: "bg-border", textClass: "text-foreground" },
  ];

  const semanticColors = [
    { name: "Primary", class: "bg-primary", textClass: "text-background" },
    { name: "Secondary", class: "bg-secondary", textClass: "text-background" },
    { name: "Success", class: "bg-success", textClass: "text-background" },
    { name: "Warning", class: "bg-warning", textClass: "text-background" },
    { name: "Error", class: "bg-error", textClass: "text-background" },
    { name: "Info", class: "bg-info", textClass: "text-background" },
  ];

  const models = [
    { id: "gpt-5-mini", name: "GPT-5 Mini", cost: "0.25× credits" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", cost: "0.5× credits" },
    { id: "gpt-5", name: "GPT-5", cost: "1.0× credits" },
    {
      id: "claude-sonnet-4.5",
      name: "Claude Sonnet 4.5",
      cost: "1.5× credits",
    },
  ];

  const visibilityOptions = [
    {
      id: "public",
      name: "Public",
      icon: Globe,
      description: "Everyone can view",
    },
    {
      id: "secret",
      name: "Secret",
      icon: Link2,
      description: "Accessible via shared URL",
    },
    {
      id: "private",
      name: "Private",
      icon: Lock,
      description: "Only owner can access",
    },
  ];

  const faqs = [
    {
      question: "How do themes work?",
      answer:
        "Themes use CSS variables that automatically switch between light and dark mode based on your preference. The system theme follows your OS settings.",
    },
    {
      question: "What colors are supported?",
      answer:
        "We use a neutral color palette (neutral, stone, gray) for consistency. All colors are centralized through Tailwind CSS variables for easy theming.",
    },
    {
      question: "Can I customize the theme?",
      answer:
        "Yes! The theme system is built on CSS variables in tailwind.config.ts. You can customize colors while maintaining the neutral palette.",
    },
    {
      question: "Are all components theme-aware?",
      answer:
        "All components use theme tokens (background, foreground, surface, etc.) to ensure they work correctly in both light and dark modes.",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Tailwind Theme System Demo
          </h1>
          <p className="text-lg text-muted">
            Testing light, dark, and system themes with centralized colors
          </p>
          <div className="flex justify-center">
            <ThemeSwitcher />
          </div>
          <div className="text-sm text-muted">
            Current: <span className="font-mono font-medium">{theme}</span> |
            Resolved:{" "}
            <span className="font-mono font-medium">{resolvedTheme}</span>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-lg">
          <ThemeSelector />
        </div>

        {/* Color Palette */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Primary Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {colorExamples.map((color) => (
              <div
                key={color.name}
                className={`${color.class} ${color.textClass} p-6 rounded-xl border border-border shadow-md transition-all hover:scale-105`}
              >
                <div className="text-sm font-medium">{color.name}</div>
                <div className="text-xs opacity-70 mt-1 font-mono">
                  {color.class}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semantic Colors */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">
            Semantic Colors
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {semanticColors.map((color) => (
              <div
                key={color.name}
                className={`${color.class} ${color.textClass} p-6 rounded-xl shadow-md transition-all hover:scale-105`}
              >
                <div className="text-sm font-medium">{color.name}</div>
                <div className="text-xs opacity-70 mt-1 font-mono">
                  {color.class}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Border Radius</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {["sm", "md", "lg", "xl", "2xl", "full"].map((radius) => (
              <div
                key={radius}
                className={`bg-surface border border-border p-6 rounded-${radius} shadow-md text-center`}
              >
                <div className="text-sm font-medium text-foreground">
                  rounded-{radius}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shadows */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Shadows</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {["sm", "md", "lg", "xl"].map((shadow) => (
              <div
                key={shadow}
                className={`bg-surface border border-border p-6 rounded-xl shadow-${shadow} text-center transition-transform hover:scale-105`}
              >
                <div className="text-sm font-medium text-foreground">
                  shadow-{shadow}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Elements */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">
            Interactive Elements
          </h2>
          <div className="bg-surface border border-border rounded-2xl p-8 shadow-lg space-y-6">
            {/* Token Indicators (Dashboard Style) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Token Limit Indicators (Dashboard Style)
              </h3>
              <div className="flex flex-wrap gap-4">
                {/* Normal state */}
                <div className="px-3 py-1.5 rounded-full border flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700">
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium whitespace-nowrap">
                    1.5M
                  </span>
                  <svg
                    className="w-3 h-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Low tokens warning */}
                <div className="px-3 py-1.5 rounded-full border flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-xs font-medium whitespace-nowrap">
                    5.2K
                  </span>
                  <svg
                    className="w-3 h-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Exhausted tokens error */}
                <div className="px-3 py-1.5 rounded-full border flex items-center gap-1.5 bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300">
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-xs font-medium whitespace-nowrap">
                    0 tokens
                  </span>
                  <svg
                    className="w-3 h-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">
                Button Styles
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                4 core button styles used across the app
              </p>

              <div className="grid gap-6">
                {/* Solid */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Solid
                  </h4>
                  <button className="px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full font-medium transition-colors shadow-sm">
                    Primary Button
                  </button>
                  <code className="text-xs text-neutral-600 dark:text-neutral-400 block">
                    bg-neutral-900 dark:bg-neutral-100 | text-neutral-50
                    dark:text-neutral-900
                  </code>
                </div>

                {/* Outlined */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Outlined
                  </h4>
                  <button className="px-6 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full border border-neutral-300 dark:border-neutral-600 font-medium transition-colors">
                    Outlined Button
                  </button>
                  <code className="text-xs text-neutral-600 dark:text-neutral-400 block">
                    border border-neutral-300 dark:border-neutral-600 |
                    hover:bg-neutral-100 dark:hover:bg-neutral-800
                  </code>
                </div>

                {/* Secondary */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Secondary
                  </h4>
                  <button className="px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full font-medium transition-colors">
                    Secondary Button
                  </button>
                  <code className="text-xs text-neutral-600 dark:text-neutral-400 block">
                    bg-neutral-100 dark:bg-neutral-800 | hover:bg-neutral-200
                    dark:hover:bg-neutral-700
                  </code>
                </div>

                {/* Disabled */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Disabled
                  </h4>
                  <button className="px-6 py-3 bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed rounded-full font-medium">
                    Disabled Button
                  </button>
                  <code className="text-xs text-neutral-600 dark:text-neutral-400 block">
                    bg-neutral-300 dark:bg-neutral-700 | text-neutral-500
                    dark:text-neutral-400 | cursor-not-allowed
                  </code>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Inputs</h3>
              <div className="max-w-md space-y-3">
                <input
                  type="text"
                  placeholder="Enter text..."
                  className="w-full px-4 py-3 bg-surface text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                />
                <textarea
                  placeholder="Enter message..."
                  rows={3}
                  className="w-full px-4 py-3 bg-surface text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none"
                />
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Cards (Pricing Style)
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 p-6 rounded-2xl space-y-2 transition-all duration-300 hover:shadow-xl">
                  <h4 className="text-base font-medium text-foreground">
                    Standard Card
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    This card uses the pricing page style with rounded-2xl,
                    border-2, and hover shadow effect.
                  </p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/50 border-2 border-neutral-900 dark:border-neutral-100 p-6 rounded-2xl space-y-2 shadow-md transition-all duration-300 hover:shadow-xl">
                  <h4 className="text-base font-medium text-foreground">
                    Featured Card
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Popular/featured card with darker border and elevated
                    styling for emphasis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dropdown Menus */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Dropdown Menus</h2>
          <div className="bg-surface border border-border rounded-2xl p-8 shadow-lg space-y-6">
            {/* Model Selector Dropdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Model Selector (Chat Style)
              </h3>
              <div className="relative max-w-md" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-surface text-foreground border border-border rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <span className="font-medium">{selectedModel}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-[50] overflow-hidden">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.name);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {model.name}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {model.cost}
                          </div>
                        </div>
                        {selectedModel === model.name && (
                          <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Visibility Selector with Submenu */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Visibility Selector (Nested Menu)
              </h3>
              <div className="relative max-w-md" ref={visibilityRef}>
                <button
                  onClick={() =>
                    setIsVisibilityDropdownOpen(!isVisibilityDropdownOpen)
                  }
                  className="w-full flex items-center justify-between px-4 py-3 bg-surface text-foreground border border-border rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = visibilityOptions.find(
                        (opt) => opt.id === selectedVisibility
                      )?.icon;
                      return Icon ? (
                        <Icon className="w-4 h-4 text-muted" />
                      ) : null;
                    })()}
                    <span className="font-medium capitalize">
                      {selectedVisibility}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted transition-transform ${
                      isVisibilityDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isVisibilityDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-[50] overflow-hidden">
                    {visibilityOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSelectedVisibility(option.id);
                          setIsVisibilityDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <option.icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {option.name}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">
                              {option.description}
                            </div>
                          </div>
                          {selectedVisibility === option.id && (
                            <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">
            FAQ Accordion (Pricing Style)
          </h2>
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-8">
            <div className="max-w-3xl mx-auto space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-600"
                >
                  <button
                    onClick={() =>
                      setOpenFaqIndex(openFaqIndex === index ? null : index)
                    }
                    className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                  >
                    <span className="font-semibold text-foreground pr-4">
                      {faq.question}
                    </span>
                    <svg
                      className={`flex-shrink-0 w-5 h-5 text-neutral-600 dark:text-neutral-400 transition-transform duration-200 ${
                        openFaqIndex === index ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openFaqIndex === index
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-6 pb-4 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted py-8 border-t border-border">
          <p>✨ Theme system powered by Tailwind CSS + CSS Variables ✨</p>
          <p className="mt-2">
            All colors follow the neutral palette design system
          </p>
        </div>
      </div>
    </div>
  );
}
