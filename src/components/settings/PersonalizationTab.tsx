"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  MessageSquare,
  User,
  Code2,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";

export default function PersonalizationTab() {
  const [customInstructions, setCustomInstructions] = useState("");
  const [selectedTone, setSelectedTone] = useState<string | null>("default");
  const [occupation, setOccupation] = useState("");
  const [techStack, setTechStack] = useState("");

  // Memory and context settings
  const [enableMemory, setEnableMemory] = useState(false);
  const [referenceChatHistory, setReferenceChatHistory] = useState(true);

  // AI capabilities
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  const [enableImageGeneration, setEnableImageGeneration] = useState(true);
  const [enableCodeExecution, setEnableCodeExecution] = useState(true);

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/user/personalization");
      if (!response.ok) throw new Error("Failed to load settings");

      const data = await response.json();
      setCustomInstructions(data.customInstructions || "");
      setSelectedTone(data.responseTone || "default");
      setOccupation(data.occupation || "");
      setTechStack(data.techStack || "");
      setEnableMemory(data.enableMemory ?? false);
      setReferenceChatHistory(data.referenceChatHistory ?? true);
      setEnableWebSearch(data.enableWebSearch ?? true);
      setEnableImageGeneration(data.enableImageGeneration ?? true);
      setEnableCodeExecution(data.enableCodeExecution ?? true);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load personalization settings");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/personalization", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responseTone: selectedTone,
          customInstructions,
          occupation,
          techStack,
          enableMemory,
          referenceChatHistory,
          enableWebSearch,
          enableImageGeneration,
          enableCodeExecution,
        }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast.success("Preferences saved");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save on changes
  useEffect(() => {
    if (hasChanges && !isLoading) {
      const timer = setTimeout(() => {
        saveSettings();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    customInstructions,
    selectedTone,
    occupation,
    techStack,
    enableMemory,
    referenceChatHistory,
    enableWebSearch,
    enableImageGeneration,
    enableCodeExecution,
    hasChanges,
    isLoading,
  ]);

  const toneOptions = [
    {
      id: "default",
      label: "Default",
      description: "Balanced and helpful",
    },
    {
      id: "concise",
      label: "Concise",
      description: "Brief and to-the-point",
    },
    {
      id: "detailed",
      label: "Detailed",
      description: "Thorough explanations",
    },
    {
      id: "encouraging",
      label: "Encouraging",
      description: "Supportive and positive",
    },
    {
      id: "professional",
      label: "Professional",
      description: "Formal and technical",
    },
  ];

  const handleChange = () => {
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Saving Indicator */}
      {isSaving && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-full text-sm font-medium shadow-lg z-50">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </div>
      )}

      {/* Response Style Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-muted">
            <MessageSquare className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Response Style
            </h3>
            <p className="text-sm text-muted-foreground">
              Choose how Craft AI communicates with you
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {toneOptions.map((tone) => (
            <button
              key={tone.id}
              onClick={() => {
                setSelectedTone(tone.id);
                handleChange();
              }}
              className={`relative p-4 rounded-xl border text-left transition-all ${
                selectedTone === tone.id
                  ? "border-foreground bg-foreground/5"
                  : "border-input hover:border-foreground/30 bg-muted/30"
              }`}
            >
              {selectedTone === tone.id && (
                <div className="absolute top-3 right-3">
                  <Check className="w-4 h-4 text-foreground" />
                </div>
              )}
              <p className="text-sm font-medium text-foreground">
                {tone.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tone.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      <hr className="border-border" />

      {/* Developer Profile Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-muted">
            <User className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Developer Profile
            </h3>
            <p className="text-sm text-muted-foreground">
              Help AI understand your background for better assistance
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Your Role
            </Label>
            <Input
              value={occupation}
              onChange={(e) => {
                setOccupation(e.target.value);
                handleChange();
              }}
              placeholder="e.g., Full-stack developer, Frontend engineer, Student"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Preferred Tech Stack
            </Label>
            <Textarea
              value={techStack}
              onChange={(e) => {
                setTechStack(e.target.value);
                handleChange();
              }}
              placeholder="e.g., Next.js, TypeScript, Tailwind CSS, Prisma, React Query, Zod"
              className="min-h-[80px] rounded-xl resize-none"
            />
            <p className="text-xs text-muted-foreground">
              AI will prioritize these technologies when suggesting solutions
            </p>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Custom Instructions Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-muted">
            <Sparkles className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Custom Instructions
            </h3>
            <p className="text-sm text-muted-foreground">
              Specific preferences for AI behavior
            </p>
          </div>
        </div>

        <Textarea
          value={customInstructions}
          onChange={(e) => {
            setCustomInstructions(e.target.value);
            handleChange();
          }}
          placeholder="Example: Always provide TypeScript examples. Include comments explaining complex logic. Prefer functional components over class components."
          className="min-h-[120px] rounded-xl resize-none"
        />
        <p className="text-xs text-muted-foreground">
          These instructions are included in every AI conversation
        </p>
      </section>

      <hr className="border-border" />

      {/* Context & Features Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-muted">
            <Code2 className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Context & Features
            </h3>
            <p className="text-sm text-muted-foreground">
              Control AI context awareness
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-input">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">
                Save memories
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Only saves important info like your expertise and core tech
                stack (very selective)
              </p>
            </div>
            <Switch
              checked={enableMemory}
              onCheckedChange={(checked) => {
                setEnableMemory(checked);
                handleChange();
              }}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-input">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">
                Reference chat history
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow AI to reference previous conversations within a project
              </p>
            </div>
            <Switch
              checked={referenceChatHistory}
              onCheckedChange={(checked) => {
                setReferenceChatHistory(checked);
                handleChange();
              }}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-input">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">Web search</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Search the web for current information and documentation
              </p>
            </div>
            <Switch
              checked={enableWebSearch}
              onCheckedChange={(checked) => {
                setEnableWebSearch(checked);
                handleChange();
              }}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-input">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">
                Image generation
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate images for designs, mockups, and visual assets
              </p>
            </div>
            <Switch
              checked={enableImageGeneration}
              onCheckedChange={(checked) => {
                setEnableImageGeneration(checked);
                handleChange();
              }}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-input">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">
                Code execution
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Run code in sandboxed environment for live preview (disable for
                code review only)
              </p>
            </div>
            <Switch
              checked={enableCodeExecution}
              onCheckedChange={(checked) => {
                setEnableCodeExecution(checked);
                handleChange();
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
