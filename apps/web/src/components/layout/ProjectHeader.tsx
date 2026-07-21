"use client";

import { useState } from "react";
import type { Project } from "@cloudarch/shared";
import { ProjectSettings } from "@/components/projects/ProjectSettings";
import { SidebarToggle } from "@/components/layout/AppShell";

interface ProjectHeaderProps {
  project: Project;
  onUpdated: (project: Project) => void;
  onDeploy?: () => void;
}

export function ProjectHeader({ project, onUpdated, onDeploy }: ProjectHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  async function saveName() {
    if (!name.trim() || name === project.name) {
      setEditing(false);
      setName(project.name);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const updated = await res.json();
      onUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-5 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarToggle />
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") {
                setName(project.name);
                setEditing(false);
              }
            }}
            autoFocus
            disabled={saving}
            className="text-sm font-semibold border border-accent rounded-lg px-2 py-1 focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-foreground hover:text-accent truncate max-w-[240px]"
            title="Click to rename"
          >
            {project.name}
          </button>
        )}
        <span className="text-xs text-muted hidden sm:inline">
          {project.complianceLevel}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-background transition-colors"
          title="Edit project"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <a
          href={`/projects/${project.projectId}/deploy`}
          className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted hover:text-accent px-3 py-2 rounded-lg hover:bg-background transition-colors"
        >
          Full export
        </a>
        <button
          onClick={() => onDeploy?.()}
          disabled={!onDeploy}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Deploy on AWS
        </button>
      </div>

      {showSettings && (
        <ProjectSettings
          project={project}
          onUpdated={onUpdated}
          onClose={() => setShowSettings(false)}
        />
      )}
    </header>
  );
}
