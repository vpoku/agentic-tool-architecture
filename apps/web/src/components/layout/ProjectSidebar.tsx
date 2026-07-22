"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Project } from "@cloudarch/shared";

interface ProjectSidebarProps {
  activeProjectId?: string;
  onNewProject?: () => void;
  collapsed?: boolean;
}

export function ProjectSidebar({
  activeProjectId,
  onNewProject,
  collapsed = false,
}: ProjectSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data.projects ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects, pathname]);

  async function handleNewProject() {
    if (onNewProject) {
      onNewProject();
      return;
    }
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Project", description: "" }),
    });
    const data = await res.json();
    if (data.projectId) {
      router.push("/app");
      router.refresh();
    }
  }

  async function handleDelete(e: React.MouseEvent, projectId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this project? This cannot be undone.")) return;
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (activeProjectId === projectId) {
      router.push("/");
    }
    loadProjects();
  }

  if (collapsed) return null;

  return (
    <aside className="w-64 h-full border-r border-border bg-card flex flex-col">
      <div className="p-3 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-background transition-colors">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="font-semibold text-foreground text-sm">CloudArch</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Projects</p>
          <button
            onClick={handleNewProject}
            className="p-1 rounded-md text-muted hover:text-accent hover:bg-accent-muted transition-colors"
            title="New project"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {loading && (
          <p className="text-sm text-muted px-2 py-4 animate-pulse-soft">Loading…</p>
        )}
        {!loading && projects.length === 0 && (
          <p className="text-xs text-muted px-2 py-3 leading-relaxed">
            No projects yet. Click + to start.
          </p>
        )}
        {projects.map((project) => (
          <Link
            key={project.projectId}
            href={
              project.projectType === "migration"
                ? `/projects/${project.projectId}/migration`
                : `/projects/${project.projectId}`
            }
            className={`group flex items-start justify-between gap-2 rounded-lg px-3 py-2.5 mb-0.5 transition-colors ${
              activeProjectId === project.projectId
                ? "bg-accent-muted text-accent"
                : "hover:bg-background text-foreground"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{project.name}</p>
              <p className="text-[11px] text-muted truncate mt-0.5">
                {project.projectType === "migration"
                  ? project.status === "ready"
                    ? "Migration ready"
                    : "Migration draft"
                  : project.status === "ready"
                    ? "Architecture ready"
                    : "Draft"}
              </p>
            </div>
            <button
              onClick={(e) => handleDelete(e, project.projectId)}
              className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger p-1 transition-opacity flex-shrink-0"
              title="Delete project"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </Link>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <p className="text-[10px] text-muted px-2">GovCloud · us-gov-west-1</p>
      </div>
    </aside>
  );
}
