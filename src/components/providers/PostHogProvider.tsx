"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Determine environment
const isProduction = process.env.NODE_ENV === "production";

// Simple environment log
if (typeof window !== "undefined") {
  console.log(`[Craft] Environment: ${process.env.NODE_ENV}`);
}

// Initialize PostHog only on client side AND only in production
// Development data will NOT be sent to PostHog to keep analytics clean
if (typeof window !== "undefined" && isProduction) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost || "https://us.i.posthog.com",

      // ========================================
      // CORE ANALYTICS
      // ========================================
      person_profiles: "identified_only", // Only create profiles for identified users
      capture_pageview: false, // We capture pageviews manually for Next.js App Router
      capture_pageleave: true, // Track when users leave pages

      // ========================================
      // SESSION REPLAY (Records user sessions)
      // ========================================
      disable_session_recording: false, // Enable session replay
      session_recording: {
        // Mask all text inputs by default for privacy
        maskAllInputs: true,
        // Mask specific sensitive elements
        maskInputOptions: {
          password: true,
          email: false, // Allow email to be visible for debugging
        },
      },

      // ========================================
      // ERROR TRACKING (Autocapture JS errors)
      // ========================================
      autocapture: {
        dom_event_allowlist: ["click", "submit", "change"], // Track these DOM events
        url_allowlist: [".*"], // Track on all URLs
        element_allowlist: [
          "a",
          "button",
          "form",
          "input",
          "select",
          "textarea",
        ],
      },
      capture_performance: true, // Capture web vitals and performance metrics

      // ========================================
      // FEATURE FLAGS & EXPERIMENTS
      // ========================================
      bootstrap: {
        // Feature flags will be fetched on init
        // You can also bootstrap with known flags for faster initial load
      },

      // ========================================
      // HEATMAPS & CLICK TRACKING
      // ========================================
      enable_heatmaps: true, // Enable heatmaps (click tracking)

      // ========================================
      // ADVANCED OPTIONS
      // ========================================
      persistence: "localStorage+cookie", // Persist user identity
      cross_subdomain_cookie: true, // Share identity across subdomains
      secure_cookie: true, // Always secure in production

      loaded: () => {
        // PostHog loaded successfully in production
      },
    });

    // ========================================
    // GLOBAL ERROR HANDLER (Capture uncaught errors)
    // ========================================
    // Capture unhandled JavaScript errors
    window.addEventListener("error", (event) => {
      posthog.capture("$exception", {
        $exception_message: event.message,
        $exception_type: event.error?.name || "Error",
        $exception_source: event.filename,
        $exception_lineno: event.lineno,
        $exception_colno: event.colno,
        $exception_stack_trace: event.error?.stack,
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      posthog.capture("$exception", {
        $exception_message: event.reason?.message || String(event.reason),
        $exception_type: event.reason?.name || "UnhandledRejection",
        $exception_stack_trace: event.reason?.stack,
      });
    });
  }
}

// Component to track page views
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (pathname && posthogClient) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthogClient.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams, posthogClient]);

  return null;
}

// Wrapper with Suspense for useSearchParams
function SuspendedPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // If PostHog key is not configured, just render children
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <SuspendedPageView />
      {children}
    </PHProvider>
  );
}

// Export posthog instance for direct usage
export { posthog };
