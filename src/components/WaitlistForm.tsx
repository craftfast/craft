"use client";

import { useState } from "react";

interface FormState {
  email: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
}

export default function WaitlistForm() {
  const [state, setState] = useState<FormState>({
    email: "",
    isSubmitting: false,
    isSuccess: false,
    error: null,
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(state.email)) {
      setState((prev) => ({
        ...prev,
        error: "Please enter a valid email address",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Submit to API route
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: state.email }),
      });

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          isSuccess: true,
          email: "",
        }));

        // Dispatch custom event to update the counter
        window.dispatchEvent(new CustomEvent("waitlist-updated"));
      } else {
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: data.error || "Something went wrong. Please try again.",
        }));
      }
    } catch (err) {
      console.error("API error:", err);
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: "Network error. Please check your connection and try again.",
      }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({
      ...prev,
      email: e.target.value,
      error: null,
      isSuccess: false,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="flex gap-3">
        <input
          type="email"
          value={state.email}
          onChange={handleEmailChange}
          placeholder="Enter your email"
          className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-700/50 text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500/30 transition-all duration-200 rounded-lg backdrop-blur-sm"
          disabled={state.isSubmitting}
          required
        />
        <button
          type="submit"
          disabled={state.isSubmitting || !state.email.trim()}
          className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-100 disabled:bg-gray-600 disabled:text-gray-400 transition-all duration-200 rounded-lg disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-white/10"
        >
          {state.isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
              <span className="italic">Joining...</span>
            </>
          ) : (
            <>
              <span className="italic">Join waitlist</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>

      {state.error && (
        <div className="mt-3">
          <p className="text-red-400 text-sm">{state.error}</p>
        </div>
      )}

      {state.isSuccess && (
        <div className="mt-4 text-center">
          <div className="text-2xl mb-3 text-white">✓</div>
          <h3 className="text-lg font-medium text-white mb-2 italic">
            You&apos;re on the list
          </h3>
          <p className="text-sm text-gray-300 font-light">
            We&apos;ll email you when beta access is ready.
          </p>
        </div>
      )}
    </form>
  );
}
