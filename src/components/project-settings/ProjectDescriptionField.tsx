"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProjectDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ProjectDescriptionField({
  value,
  onChange,
  disabled = false,
}: ProjectDescriptionFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="project-description">Description</Label>
      <Textarea
        id="project-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your project..."
        className="rounded-lg min-h-[100px]"
        disabled={disabled}
      />
    </div>
  );
}
