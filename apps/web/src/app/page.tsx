"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectSidebar } from "@/components/layout/ProjectSidebar";

export default function HomePage() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const data = await res.json();
      if (data.projectId) {
        const params = new URLSearchParams({ q: description.trim() });
        router.push(`/projects/${data.projectId}?${params.toString()}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen">
      <ProjectSidebar />
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-xl">
          <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">
            Design on AWS GovCloud
          </h1>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            Describe your project in plain English. CloudArch will recommend services, sketch your
            backend pipeline, and generate deploy scripts for your AI IDE.
          </p>

          <form onSubmit={handleStart} className="rounded-2xl border border-border bg-card shadow-panel p-1">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="e.g. FedRAMP-compliant document intake handling 10k docs/day with PII encryption..."
              className="w-full resize-none rounded-xl px-4 py-4 text-sm focus:outline-none bg-transparent"
            />
            <div className="flex justify-between items-center px-3 pb-3">
              <p className="text-xs text-muted">GovCloud · us-gov-west-1</p>
              <button
                type="submit"
                disabled={loading || !description.trim()}
                className="bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {loading ? "Starting..." : "Start project"}
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              "Document intake, 10k/day, FedRAMP",
              "Secure API for mobile app",
              "Real-time analytics pipeline",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setDescription(chip)}
                className="text-xs text-muted border border-border rounded-full px-3 py-1.5 hover:border-accent hover:text-accent transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
