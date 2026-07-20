"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Project } from "@cloudarch/shared";

interface ProjectSidebarProps {
  project: Project;
}

const NAV_ITEMS = [
  { segment: "blueprint", icon: "hub", label: "Visual Pipeline" },
  { segment: "compare", icon: "compare_arrows", label: "Service Deep-Dive" },
  { segment: "cost", icon: "payments", label: "Cost Estimator" },
  { segment: "deploy", icon: "cloud_upload", label: "Deploy Export" },
];

export function ProjectSidebar({ project }: ProjectSidebarProps) {
  const pathname = usePathname();
  const base = `/projects/${project.projectId}`;

  return (
    <aside className="fixed left-0 top-20 h-[calc(100vh-80px)] w-[300px] bg-surface-container-low border-r border-outline-variant flex flex-col p-panel-padding z-40">
      <div className="flex items-center gap-4 mb-8 px-unit">
        <div className="w-1.5 h-10 bg-primary rounded-full" />
        <div>
          <h2 className="font-display text-xl text-secondary leading-tight font-bold">
            {project.name}
          </h2>
          <p className="text-body-sm text-on-surface-variant font-medium">
            {project.complianceLevel}
          </p>
        </div>
      </div>

      <nav className="flex-grow space-y-1">
        {NAV_ITEMS.map((item) => {
          const href = `${base}/${item.segment}`;
          const active = pathname === href;
          return (
            <Link
              key={item.segment}
              href={href}
              className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all ${
                active
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-label-caps uppercase">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        className="mt-4 bg-secondary text-on-secondary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-colors shadow-sm"
      >
        <span className="material-symbols-outlined">add</span>
        New Analysis
      </Link>

      <div className="pt-6 mt-6 border-t border-outline-variant space-y-1">
        <Link
          href="/learn"
          className="w-full flex items-center gap-4 px-5 py-2 text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">school</span>
          <span className="text-body-sm font-medium">Learning Hub</span>
        </Link>
      </div>
    </aside>
  );
}
