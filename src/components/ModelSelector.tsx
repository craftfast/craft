"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, Brain, Sparkles, Check, ChevronDown } from "lucide-react";

// Model tier types
export type ModelTier = "best" | "fast" | "expert";

interface ModelSelectorProps {
  selectedTier: ModelTier;
  onTierChange: (tier: ModelTier) => void;
  userPlan?: "HOBBY" | "PRO" | "ENTERPRISE";
  className?: string;
}

export function ModelSelector({
  selectedTier,
  onTierChange,
  userPlan = "HOBBY",
  className = "",
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const tiers = [
    {
      id: "best" as ModelTier,
      name: "Best",
      icon: Sparkles,
      description: "Auto-selects between Fast & Expert",
      color: "text-neutral-700 dark:text-neutral-300",
    },
    {
      id: "fast" as ModelTier,
      name: "Fast",
      icon: Zap,
      description: "Quick responses, lower cost",
      color: "text-neutral-600 dark:text-neutral-400",
    },
    {
      id: "expert" as ModelTier,
      name: "Expert",
      icon: Brain,
      description: "Deep reasoning, premium quality",
      color: "text-neutral-800 dark:text-neutral-200",
      isPremium: true,
    },
  ];

  const selectedTierData = tiers.find((t) => t.id === selectedTier) || tiers[0];
  const SelectedIcon = selectedTierData.icon;

  // Check if user can access premium tiers
  const canAccessPremium = userPlan === "PRO" || userPlan === "ENTERPRISE";

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 bg-transparent hover:bg-surface-hover text-foreground rounded-full transition-colors text-xs"
        aria-label="Select model tier"
        title="Select model tier"
      >
        <SelectedIcon className={`w-3 h-3 ${selectedTierData.color}`} />
        <span className="font-medium">{selectedTierData.name}</span>
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-xl shadow-lg z-[60] overflow-hidden">
          <div className="p-1">
            {tiers.map((tier) => {
              const TierIcon = tier.icon;
              const isSelected = selectedTier === tier.id;
              const hasAccess = !tier.isPremium || canAccessPremium;

              return (
                <button
                  key={tier.id}
                  onClick={() => {
                    if (hasAccess) {
                      onTierChange(tier.id);
                      setIsOpen(false);
                    }
                  }}
                  disabled={!hasAccess}
                  className={`w-full px-3 py-2.5 text-left transition-colors flex items-start gap-3 rounded-lg group ${
                    hasAccess
                      ? "hover:bg-surface-hover cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  title={
                    !hasAccess
                      ? "Upgrade to Pro to access Expert mode"
                      : tier.description
                  }
                >
                  <TierIcon
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.color}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          hasAccess
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {tier.name}
                      </span>
                      {!hasAccess && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          Pro
                        </span>
                      )}
                      {isSelected && hasAccess && (
                        <Check className="w-3.5 h-3.5 text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tier.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
