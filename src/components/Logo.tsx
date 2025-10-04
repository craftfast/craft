import React from "react";
import Link from "next/link";

interface LogoIconProps {
  width?: number;
  height?: number;
  className?: string;
}

/**
 * 3D Cube Logo Icon Component
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
      viewBox="0 0 20 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 1L1 6L10 11L19 6L10 1Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 6L10 11V21L1 16V6Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19 6L10 11V21L19 16V6Z"
        fill="currentColor"
        opacity="0.5"
      />
      <path
        d="M1 6L10 1L19 6M1 6V16L10 21M1 6L10 11M10 21L19 16V6M10 21V11M19 6L10 11"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.4"
      />
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
  sm: { width: 20, height: 22 },
  md: { width: 24, height: 26 },
  lg: { width: 32, height: 35 },
};

const textSizes = {
  sm: "text-base sm:text-lg",
  md: "text-xl sm:text-2xl",
  lg: "text-2xl sm:text-3xl",
  xl: "text-3xl sm:text-4xl",
};

/**
 * Full Craft Logo Component
 * Options to show icon only, text only, or both
 */
export default function Logo({
  showIcon = true,
  showText = true,
  iconSize = "lg",
  textSize = "md",
  className = "",
  iconClassName = "",
  textClassName = "",
  href = "/", // Default to home page
}: LogoProps) {
  const size = iconSizes[iconSize];

  const logoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <LogoIcon
          width={size.width}
          height={size.height}
          className={`flex-shrink-0 text-foreground ${iconClassName}`}
        />
      )}
      {showText && (
        <span
          className={`font-medium text-foreground tracking-wide ${textSizes[textSize]} ${textClassName}`}
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
