"use client";

import { useState, useEffect } from "react";

interface WaitlistCount {
  count: number;
  message: string;
}

export default function WaitlistCounter() {
  const [waitlistData, setWaitlistData] = useState<WaitlistCount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async () => {
    try {
      setError(null);
      const response = await fetch("/api/waitlist", {
        method: "GET",
        cache: "no-cache", // Ensure we get fresh data
      });

      if (response.ok) {
        const data = await response.json();
        setWaitlistData(data);
      } else {
        setError("Failed to fetch waitlist count");
      }
    } catch (err) {
      console.error("Error fetching waitlist count:", err);
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
  }, []);

  // Also provide a manual refresh function that can be called externally
  useEffect(() => {
    const handleWaitlistUpdate = () => {
      fetchCount();
    };

    // Listen for custom events (can be dispatched when someone joins)
    window.addEventListener("waitlist-updated", handleWaitlistUpdate);

    return () => {
      window.removeEventListener("waitlist-updated", handleWaitlistUpdate);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="animate-pulse">
          <div className="text-gray-400 text-sm">Loading count...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="text-gray-400 text-sm">{error}</div>
        <button
          onClick={fetchCount}
          className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-gray-300 text-sm font-light">
        <span className="font-mono text-white font-medium">
          {waitlistData?.count.toLocaleString() || 0}
        </span>
        <span className="ml-2">people on the waitlist</span>
      </div>
    </div>
  );
}
