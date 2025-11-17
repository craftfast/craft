"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface PendingProject {
  prompt: string;
  images: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  selectedModel: string;
  timestamp: number;
}

/**
 * Client component that handles pending project creation after authentication.
 * This runs when a user signs up/in after submitting a prompt on the landing page.
 */
export default function PendingProjectHandler() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessedRef = useRef(false); // Prevent double execution

  useEffect(() => {
    // Prevent running multiple times (React 18 strict mode runs effects twice)
    if (hasProcessedRef.current) {
      return;
    }
    hasProcessedRef.current = true;

    const handlePendingProject = async () => {
      try {
        // Check if localStorage is available (might be disabled in private browsing)
        if (typeof window === "undefined" || !window.localStorage) {
          console.log("⚠️ localStorage not available, redirecting to home");
          router.push("/");
          return;
        }

        // Check localStorage for pending project
        const pendingProjectData = localStorage.getItem("pendingProject");

        if (!pendingProjectData) {
          // No pending project, redirect to home
          console.log("✅ No pending project found, redirecting to home");
          router.push("/");
          return;
        }

        // Parse the pending project data with validation
        let pendingProject: PendingProject;
        try {
          pendingProject = JSON.parse(pendingProjectData);
        } catch (parseError) {
          console.error("❌ Failed to parse pending project data:", parseError);
          localStorage.removeItem("pendingProject");
          router.push("/");
          return;
        }

        // Validate required fields
        if (
          !pendingProject.prompt ||
          typeof pendingProject.prompt !== "string" ||
          !pendingProject.prompt.trim()
        ) {
          console.log("⚠️ Invalid pending project (empty prompt), clearing");
          localStorage.removeItem("pendingProject");
          router.push("/");
          return;
        }

        // Validate timestamp exists and is a number
        if (
          !pendingProject.timestamp ||
          typeof pendingProject.timestamp !== "number"
        ) {
          console.log(
            "⚠️ Invalid pending project (missing timestamp), clearing"
          );
          localStorage.removeItem("pendingProject");
          router.push("/");
          return;
        }

        // Check if the pending project is not too old (24 hours)
        const isExpired =
          Date.now() - pendingProject.timestamp > 24 * 60 * 60 * 1000;
        if (isExpired) {
          console.log(
            "⏰ Pending project expired, clearing and redirecting to home"
          );
          localStorage.removeItem("pendingProject");
          router.push("/");
          return;
        }

        // Validate model selection
        if (
          !pendingProject.selectedModel ||
          typeof pendingProject.selectedModel !== "string"
        ) {
          console.log(
            "⚠️ Invalid model selection, backend will use config default"
          );
          pendingProject.selectedModel = ""; // Empty string - backend will use config default
        }

        // Validate images array
        if (!Array.isArray(pendingProject.images)) {
          console.log("⚠️ Invalid images array, using empty array");
          pendingProject.images = [];
        }

        console.log(
          "🚀 Creating project from pending prompt:",
          pendingProject.prompt
        );

        // Create the project
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "New Project",
            description: pendingProject.prompt,
            selectedModel: pendingProject.selectedModel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to create project:", errorData);
          // Clear pending project and redirect to home
          localStorage.removeItem("pendingProject");
          router.push("/");
          return;
        }

        const data = await response.json();

        // Validate response has project ID
        if (!data.project?.id) {
          console.error("❌ No project ID in response:", data);
          localStorage.removeItem("pendingProject");
          router.push("/");
          return;
        }

        console.log("✅ Project created successfully:", data.project.id);

        // Store images in sessionStorage if they exist (with error handling)
        if (pendingProject.images.length > 0) {
          try {
            if (typeof window !== "undefined" && window.sessionStorage) {
              sessionStorage.setItem(
                `project-${data.project.id}-images`,
                JSON.stringify(pendingProject.images)
              );
            }
          } catch (storageError) {
            console.warn(
              "⚠️ Failed to store images in sessionStorage:",
              storageError
            );
            // Continue anyway - images not critical for project creation
          }
        }

        // Store selected model in sessionStorage (with error handling)
        try {
          if (typeof window !== "undefined" && window.sessionStorage) {
            sessionStorage.setItem(
              `project-${data.project.id}-model`,
              pendingProject.selectedModel
            );
          }
        } catch (storageError) {
          console.warn(
            "⚠️ Failed to store model in sessionStorage:",
            storageError
          );
          // Continue anyway - model already saved in project
        }

        // Clear the pending project from localStorage
        try {
          localStorage.removeItem("pendingProject");
        } catch (storageError) {
          console.warn("⚠️ Failed to clear pending project:", storageError);
          // Continue anyway - we're redirecting
        }

        // Redirect to the project coding interface
        router.push(`/chat/${data.project.id}`);
      } catch (error) {
        console.error("Error handling pending project:", error);
        // Clear pending project and redirect to home on error
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.removeItem("pendingProject");
          }
        } catch (storageError) {
          console.warn(
            "⚠️ Failed to clear pending project on error:",
            storageError
          );
        }
        router.push("/");
      } finally {
        setIsProcessing(false);
      }
    };

    handlePendingProject();
  }, [router]);

  // Show a loading state while processing
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-4"></div>
          <p className="text-muted-foreground">Creating your project...</p>
        </div>
      </div>
    );
  }

  return null;
}
