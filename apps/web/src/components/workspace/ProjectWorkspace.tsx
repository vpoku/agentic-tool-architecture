"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { ArchitectureProposal, Project } from "@cloudarch/shared";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { PipelineCanvas } from "@/components/pipeline/PipelineCanvas";
import { ProjectHeader } from "@/components/layout/ProjectHeader";

interface ProjectWorkspaceProps {
  project: Project;
  bootstrapMessage?: string;
}

export function ProjectWorkspace({ project: initialProject, bootstrapMessage }: ProjectWorkspaceProps) {
  const [project, setProject] = useState(initialProject);
  const router = useRouter();

  const handleArchitectureGenerated = useCallback(
    (architecture: ArchitectureProposal) => {
      setProject((prev) => ({ ...prev, architecture, status: "ready" }));
      router.refresh();
    },
    [router]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <ProjectHeader project={project} onUpdated={setProject} />
      <div className="flex flex-1 min-h-0">
        <div className="w-[380px] flex-shrink-0 border-r border-border min-h-0">
          <ChatWorkspace
            projectId={project.projectId}
            initialDescription={bootstrapMessage}
            onArchitectureGenerated={handleArchitectureGenerated}
          />
        </div>
        <div className="flex-1 min-h-0 flex flex-col bg-background">
          <PipelineCanvas projectId={project.projectId} architecture={project.architecture} />
        </div>
      </div>
    </div>
  );
}
