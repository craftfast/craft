"use client";

import { useState, useRef, useEffect } from "react";
import {
  SUGGESTED_TOPUP_AMOUNTS,
  PLATFORM_FEE_PERCENT,
  GST_PERCENT,
} from "@/lib/pricing-constants";

interface CreditSelectorProps {
  selectedAmount: number;
  onAmountChange: (amount: number) => void;
}

/**
 * Credit amount selector for pay-as-you-go top-ups
 * Shows suggested amounts with platform fee calculation
 */
export default function CreditSelector({
  selectedAmount,
  onAmountChange,
}: CreditSelectorProps) {
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatAmount = (amount: number) => {
    return `$${amount}`;
  };

  const getTotalWithFee = (amount: number) => {
    const withFee = amount * (1 + PLATFORM_FEE_PERCENT);
    return withFee * (1 + GST_PERCENT);
  };

  const handleSelect = (amount: number) => {
    onAmountChange(amount);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-3 text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:focus:ring-neutral-400 transition-all duration-200 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
      >
        <span className="text-neutral-900 dark:text-neutral-100">
          {formatAmount(selectedAmount)} balance
        </span>
        <svg
          className={`w-4 h-4 text-neutral-600 dark:text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 mt-2 w-full left-0 right-0">
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-600 shadow-xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {SUGGESTED_TOPUP_AMOUNTS.map((amount, index) => {
                const isSelected = amount === selectedAmount;
                const totalWithFee = getTotalWithFee(amount);

                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleSelect(amount)}
                    className={`w-full px-4 py-3 text-left transition-colors duration-150 flex items-center justify-between ${
                      index !== SUGGESTED_TOPUP_AMOUNTS.length - 1
                        ? "border-b border-neutral-100 dark:border-neutral-700"
                        : ""
                    } ${
                      isSelected
                        ? "bg-neutral-100 dark:bg-neutral-700"
                        : "hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50"
                    }`}
                  >
                    <div>
                      <span
                        className={`text-sm ${
                          isSelected
                            ? "font-semibold text-neutral-900 dark:text-neutral-100"
                            : "font-medium text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        ${amount} balance
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
                        (${totalWithFee.toFixed(2)} total)
                      </span>
                    </div>
                    {/* Checkmark for selected item */}
                    <div className="w-5 h-5 flex items-center justify-center">
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-neutral-900 dark:text-neutral-100"
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
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
