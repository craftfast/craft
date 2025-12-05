"use client";

import { useParams } from "next/navigation";
import {
  useProjectSettings,
  ProjectNameField,
  ProjectDescriptionField,
  ProjectActions,
  SaveStatusIndicator,
  SettingsLoadingSkeleton,
} from "@/components/project-settings";

export default function ProjectGeneralSettingsPage() {
  const params = useParams();
  const projectId = params["project-id"] as string;

  const {
    isLoading,
    saveStatus,
    projectName,
    projectDescription,
    setProjectName,
    setProjectDescription,
    handleDuplicateProject,
    handleExportProject,
    handleDeleteProject,
  } = useProjectSettings({ projectId });

  if (isLoading) {
    return <SettingsLoadingSkeleton title="General" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border flex items-center justify-between">
        <h2 className="text-2xl font-semibold">General</h2>
        <SaveStatusIndicator status={saveStatus} />
      </div>

      {/* Settings Form */}
      <div className="space-y-6">
        <ProjectNameField value={projectName} onChange={setProjectName} />

        <ProjectDescriptionField
          value={projectDescription}
          onChange={setProjectDescription}
        />

        <ProjectActions
          onDuplicate={handleDuplicateProject}
          onExport={handleExportProject}
          onDelete={handleDeleteProject}
        />
      </div>
    </div>
  );
}
