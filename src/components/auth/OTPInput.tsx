"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  className,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Split value into array of characters
  const valueArray = value.split("").slice(0, length);
  while (valueArray.length < length) {
    valueArray.push("");
  }

  const focusInput = (index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleChange = (index: number, newValue: string) => {
    // Only allow numbers
    const sanitized = newValue.replace(/[^0-9]/g, "");

    if (sanitized.length === 0) {
      // Handle deletion
      const newValueArray = [...valueArray];
      newValueArray[index] = "";
      const newOTP = newValueArray.join("");
      onChange(newOTP);
      return;
    }

    if (sanitized.length === 1) {
      // Single character input
      const newValueArray = [...valueArray];
      newValueArray[index] = sanitized;
      const newOTP = newValueArray.join("");
      onChange(newOTP);

      // Auto-focus next input
      if (index < length - 1) {
        focusInput(index + 1);
      }

      // Check if OTP is complete
      if (newOTP.length === length && onComplete) {
        onComplete(newOTP);
      }
    } else if (sanitized.length > 1) {
      // Handle paste
      handlePaste(sanitized, index);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !valueArray[index] && index > 0) {
      // If current input is empty and backspace is pressed, focus previous
      focusInput(index - 1);
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (pastedData: string, startIndex: number = 0) => {
    const sanitized = pastedData.replace(/[^0-9]/g, "");
    const newValueArray = [...valueArray];

    for (let i = 0; i < sanitized.length && startIndex + i < length; i++) {
      newValueArray[startIndex + i] = sanitized[i];
    }

    const newOTP = newValueArray.join("");
    onChange(newOTP);

    // Focus the last filled input or the next empty one
    const nextIndex = Math.min(startIndex + sanitized.length, length - 1);
    focusInput(nextIndex);

    // Check if OTP is complete
    if (newOTP.length === length && onComplete) {
      onComplete(newOTP);
    }
  };

  const handlePasteEvent = (
    e: ClipboardEvent<HTMLInputElement>,
    index: number
  ) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    handlePaste(pastedData, index);
  };

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {valueArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePasteEvent(e, index)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          disabled={disabled}
          className={cn(
            // Base styles
            "w-12 h-14 text-center text-2xl font-semibold",
            "rounded-xl border-2 transition-all duration-200",
            "bg-white dark:bg-neutral-900",

            // Default state
            "border-neutral-200 dark:border-neutral-800",
            "text-neutral-900 dark:text-neutral-50",

            // Hover state
            "hover:border-neutral-300 dark:hover:border-neutral-700",

            // Focus state
            focusedIndex === index &&
              "border-neutral-900 dark:border-neutral-50 ring-4 ring-neutral-900/10 dark:ring-neutral-50/10",

            // Error state
            error && "border-red-500 dark:border-red-500 focus:ring-red-500/10",

            // Disabled state
            disabled &&
              "opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-950",

            // Filled state
            digit && "font-bold"
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
