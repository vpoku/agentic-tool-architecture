"use client";

import { useState } from "react";
import type { Project } from "@cloudarch/shared";

interface ProjectSettingsProps {
  project: Project;
  onUpdated: (project: Project) => void;
  onClose: () => void;
}

export function ProjectSettings({ project, onUpdated, onClose }: ProjectSettingsProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [complianceLevel, setComplianceLevel] = useState(project.complianceLevel);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, complianceLevel }),
      });
      const updated = await res.json();
      onUpdated(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-panel p-6">
        <h2 className="text-lg font-semibold mb-4">Edit project</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-muted">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">Compliance</span>
            <select
              value={complianceLevel}
              onChange={(e) => setComplianceLevel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option>FedRAMP High</option>
              <option>ITAR</option>
              <option>HIPAA</option>
              <option>None</option>
            </select>
          </label>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
