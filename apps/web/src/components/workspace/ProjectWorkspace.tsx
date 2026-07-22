"use client";

import type { Project } from "@cloudarch/shared";
import { CanvasBuilder } from "@/components/canvas/CanvasBuilder";

interface ProjectWorkspaceProps {
  project: Project;
  bootstrapMessage?: string;
}

/** @deprecated Use CanvasBuilder directly */
export function ProjectWorkspace({ project, bootstrapMessage }: ProjectWorkspaceProps) {
  return <CanvasBuilder project={project} bootstrapMessage={bootstrapMessage} />;
}
