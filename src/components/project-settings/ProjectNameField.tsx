"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProjectNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ProjectNameField({
  value,
  onChange,
  disabled = false,
}: ProjectNameFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="project-name">Project Name</Label>
      <Input
        id="project-name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="My Awesome Project"
        className="rounded-lg"
        disabled={disabled}
      />
    </div>
  );
}
