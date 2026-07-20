"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Project } from "@cloudarch/shared";

interface ProjectSidebarProps {
  activeProjectId?: string;
}

export function ProjectSidebar({ activeProjectId }: ProjectSidebarProps) {
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
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Project", description: "" }),
    });
    const data = await res.json();
    if (data.projectId) {
      router.push(`/projects/${data.projectId}`);
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

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="font-semibold text-foreground">CloudArch</span>
        </Link>
        <button
          onClick={handleNewProject}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        <p className="text-xs font-medium text-muted uppercase tracking-wider px-2 py-2">
          Projects
        </p>
        {loading && (
          <p className="text-sm text-muted px-2 py-4 animate-pulse-soft">Loading...</p>
        )}
        {!loading && projects.length === 0 && (
          <p className="text-sm text-muted px-2 py-4">No projects yet</p>
        )}
        {projects.map((project) => (
          <Link
            key={project.projectId}
            href={`/projects/${project.projectId}`}
            className={`group flex items-start justify-between gap-2 rounded-lg px-3 py-2.5 mb-0.5 transition-colors ${
              activeProjectId === project.projectId
                ? "bg-accent-muted text-accent"
                : "hover:bg-background text-foreground"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{project.name}</p>
              <p className="text-xs text-muted truncate mt-0.5">
                {project.status === "ready" ? "Architecture ready" : "Draft"}
              </p>
            </div>
            <button
              onClick={(e) => handleDelete(e, project.projectId)}
              className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger p-1 transition-opacity"
              title="Delete project"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    </aside>
  );
}
