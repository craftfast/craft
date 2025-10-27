"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackSentiment = "negative" | "neutral" | "positive" | null;

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState("");
  const [sentiment, setSentiment] = useState<FeedbackSentiment>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback, sentiment }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFeedback("");
        setSentiment(null);
        setTimeout(() => {
          onClose();
          setSubmitStatus("idle");
        }, 2000);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 min-h-screen">
      <div
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Give feedback
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                We'd love to hear what went well or how we can improve the
                product experience.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <div className="space-y-4">
            <div>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Your feedback"
                required
                rows={6}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 resize-none"
              />
            </div>

            {/* Emoji Reactions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setSentiment(sentiment === "negative" ? null : "negative")
                }
                className={`w-10 h-10 rounded-full border transition-all ${
                  sentiment === "negative"
                    ? "border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800"
                    : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
                aria-label="Negative feedback"
              >
                <span className="text-xl">😞</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setSentiment(sentiment === "neutral" ? null : "neutral")
                }
                className={`w-10 h-10 rounded-full border transition-all ${
                  sentiment === "neutral"
                    ? "border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800"
                    : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
                aria-label="Neutral feedback"
              >
                <span className="text-xl">😐</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setSentiment(sentiment === "positive" ? null : "positive")
                }
                className={`w-10 h-10 rounded-full border transition-all ${
                  sentiment === "positive"
                    ? "border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800"
                    : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
                aria-label="Positive feedback"
              >
                <span className="text-xl">😊</span>
              </button>
            </div>

            {submitStatus === "success" && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Thank you for your feedback!
                </p>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Failed to submit feedback. Please try again.
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 rounded-full font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !feedback.trim()}
              className="flex-1 px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
