"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Project } from "@cloudarch/shared";

export function RecentlyBuilt() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        const arch = (data.projects ?? []).filter(
          (p: Project) => p.projectType !== "migration" && p.status === "ready"
        );
        setProjects(arch.slice(0, 6));
      });
  }, []);

  if (projects.length === 0) return null;

  return (
    <section className="border-t border-border bg-card/50 px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Recently built</h2>
        <Link href="/app" className="text-xs text-accent hover:underline">
          Start building
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
        {projects.map((p) => (
          <Link
            key={p.projectId}
            href={`/projects/${p.projectId}`}
            className="flex-shrink-0 w-56 rounded-xl border border-border bg-card p-4 hover:border-accent/50 hover:shadow-soft transition-all"
          >
            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
            <p className="text-[11px] text-muted mt-1 line-clamp-2">{p.description.slice(0, 80)}</p>
            <span className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-muted text-accent">
              AWS GovCloud
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
