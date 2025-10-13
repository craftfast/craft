import React from "react";
import Link from "next/link";

interface LogoIconProps {
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Rotated Rectangle Logo Icon Component
 * Can be used standalone or with the full logo
 */
export function LogoIcon({
  width = 24,
  height = 26,
  className = "",
}: LogoIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M0 35L60 0.358978V69.641L0 35Z" fill="currentColor" />
    </svg>
  );
}

interface LogoProps {
  showIcon?: boolean;
  showText?: boolean;
  iconSize?: "sm" | "md" | "lg";
  textSize?: "sm" | "md" | "lg" | "xl";
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  href?: string; // Add href prop for navigation
}

const iconSizes = {
  sm: { width: 12, height: 14 },
  md: { width: 16, height: 19 },
  lg: { width: 20, height: 23 },
};

const textSizes = {
  sm: "text-xs sm:text-sm",
  md: "text-base sm:text-lg",
  lg: "text-lg sm:text-xl",
  xl: "text-xl sm:text-2xl",
};

/**
 * Full Craft Logo Component
 * Options to show icon only, text only, or both
 */
export default function Logo({
  showIcon = true,
  showText = true,
  iconSize = "lg",
  textSize = "xl",
  className = "",
  iconClassName = "",
  textClassName = "",
  href = "/", // Default to home page
}: LogoProps) {
  const size = iconSizes[iconSize];

  const logoContent = (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {showIcon && (
        <LogoIcon
          width={size.width}
          height={size.height}
          className={`flex-shrink-0 text-foreground ${iconClassName}`}
        />
      )}
      {showText && (
        <span
          className={`font-medium text-foreground tracking-wide leading-relaxed align-middle flex items-center ${textSizes[textSize]} ${textClassName}`}
        >
          Craft
        </span>
      )}
    </div>
  );

  // If href is provided, wrap in Link
  if (href) {
    return (
      <Link
        href={href}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
