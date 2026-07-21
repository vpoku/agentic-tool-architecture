"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectSidebar } from "@/components/layout/ProjectSidebar";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { useSidebar } from "@/components/layout/SidebarContext";

interface AppShellProps {
  children: React.ReactNode;
  activeProjectId?: string;
}

export function AppShell({ children, activeProjectId }: AppShellProps) {
  const { open, toggle, close } = useSidebar();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={close}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 flex-shrink-0 transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden"
        }`}
      >
        <ProjectSidebar
          activeProjectId={activeProjectId}
          onNewProject={() => setShowCreateModal(true)}
          collapsed={!open}
        />
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-12 flex-shrink-0 border-b border-border bg-card flex items-center px-3 gap-2 md:hidden">
          <button
            type="button"
            onClick={toggle}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
            aria-label="Toggle navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-foreground">CloudArch</span>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      </div>

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(projectId) => {
          router.push(`/projects/${projectId}`);
          router.refresh();
        }}
      />
    </div>
  );
}

export function SidebarToggle() {
  const { toggle } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggle}
      className="hidden md:flex p-2 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
      aria-label="Toggle navigation"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
