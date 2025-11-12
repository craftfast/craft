"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function PersonalizationTab() {
  const [customInstructions, setCustomInstructions] = useState("");
  const [selectedTone, setSelectedTone] = useState<string | null>("default");
  const [occupation, setOccupation] = useState("");
  const [techStack, setTechStack] = useState("");

  // Memory and features
  const [enableMemory, setEnableMemory] = useState(true);
  const [referenceChatHistory, setReferenceChatHistory] = useState(true);

  // Advanced capabilities
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [enableImageGeneration, setEnableImageGeneration] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      setEnableMemory(data.enableMemory ?? true);
      setReferenceChatHistory(data.referenceChatHistory ?? true);
      setEnableWebSearch(data.enableWebSearch ?? false);
      setEnableImageGeneration(data.enableImageGeneration ?? false);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load personalization settings");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
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
        }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast.success("Preferences saved");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save preferences");
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
      description: "Brief, to-the-point responses",
    },
    { id: "detailed", label: "Detailed", description: "Thorough explanations" },
    {
      id: "encouraging",
      label: "Encouraging",
      description: "Positive and supportive",
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Response Style
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Customize how Craft AI responds and assists you
        </p>

        <div className="space-y-3">
          <Label className="text-muted-foreground">Response Tone</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {toneOptions.map((tone) => (
              <Button
                key={tone.id}
                onClick={() => {
                  setSelectedTone(tone.id === selectedTone ? null : tone.id);
                  handleChange();
                }}
                variant={selectedTone === tone.id ? "default" : "outline"}
                className="justify-start rounded-xl"
              >
                {tone.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Custom Instructions
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Add specific preferences for how AI should respond
        </p>
        <Textarea
          value={customInstructions}
          onChange={(e) => {
            setCustomInstructions(e.target.value);
            handleChange();
          }}
          placeholder="Example: Always provide code examples when explaining concepts. Prefer TypeScript over JavaScript."
          className="min-h-[100px] rounded-xl"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Developer Profile
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Help AI provide more relevant coding assistance
        </p>
        <div className="space-y-3">
          <div>
            <Label className="text-muted-foreground mb-3">Role / Title</Label>
            <Input
              value={occupation}
              onChange={(e) => {
                setOccupation(e.target.value);
                handleChange();
              }}
              placeholder="e.g., Full-stack developer, Frontend engineer"
              className="rounded-xl"
            />
          </div>

          <div>
            <Label className="text-muted-foreground mb-3">
              Tech Stack & Preferences
            </Label>
            <Textarea
              value={techStack}
              onChange={(e) => {
                setTechStack(e.target.value);
                handleChange();
              }}
              placeholder="e.g., Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma, tRPC, Framer Motion, React Hook Form, Zod"
              className="min-h-[80px] rounded-xl"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Memory & Context
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Control how AI remembers and uses information
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Save memories
              </p>
              <p className="text-xs text-muted-foreground">
                Let AI save key information about your preferences and projects
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

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Reference chat history
              </p>
              <p className="text-xs text-muted-foreground">
                Allow AI to reference previous conversations for better context
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

          {enableMemory && (
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => toast.info("Memory management coming soon")}
            >
              Manage saved memories
            </Button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Advanced Capabilities
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enable additional AI features for enhanced functionality
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Web search</p>
              <p className="text-xs text-muted-foreground">
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

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Image generation
              </p>
              <p className="text-xs text-muted-foreground">
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

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-input opacity-50">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  Code execution
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  Always enabled
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Core feature - runs code in sandboxed environment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
