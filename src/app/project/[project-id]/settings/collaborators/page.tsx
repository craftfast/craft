import { Users } from "lucide-react";

export default function ProjectCollaboratorsSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold">Collaborators</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage who can access and edit this project
        </p>
      </div>

      {/* Coming Soon */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Team collaboration features are on our roadmap. Soon you&apos;ll be
          able to invite team members to work together on projects.
        </p>
        <div className="mt-6 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm">
          Planned for future release
        </div>
      </div>
    </div>
  );
}
