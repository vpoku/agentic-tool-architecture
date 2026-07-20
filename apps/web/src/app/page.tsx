"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";

const INSPIRATION = [
  "FedRAMP-compliant document intake handling 10k docs/day",
  "High-traffic e-commerce on GovCloud",
  "Real-time IoT analytics with Kinesis",
  "Secure API backend for mobile app",
];

export default function HomePage() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
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
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: data.projectId, message: description.trim() }),
        });
        router.push(`/projects/${data.projectId}/blueprint`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen blueprint-grid">
      <AppHeader />
      <main className="pt-20 p-margin-edge">
        <div className="absolute top-28 right-margin-edge flex items-center gap-2 bg-inverse-surface text-inverse-on-surface px-5 py-2 rounded-full shadow-sm">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span className="text-label-caps uppercase">GovCloud Ready</span>
        </div>

        <div className="max-w-4xl mx-auto mt-12 flex flex-col items-center text-center">
          <div className="mb-14">
            <h1 className="font-display text-display-lg text-on-background mb-6 italic">
              Start Your Story
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Describe your problem in plain English and CloudArch will propose a GovCloud
              architecture, compare services, estimate costs, and generate deployable IaC.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full">
            <div className="w-full bg-surface border border-outline-variant rounded-2xl p-8 shadow-xl shadow-secondary/5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 font-display text-headline-md text-on-surface placeholder:text-outline-variant/60 resize-none h-32 leading-relaxed outline-none"
                placeholder="Describe your web app idea in plain English..."
              />
              <div className="flex justify-between items-end mt-6 border-t border-surface-container pt-8">
                <p className="text-body-sm text-on-surface-variant">
                  Example: FedRAMP document intake, 10k docs/day
                </p>
                <button
                  type="submit"
                  disabled={loading || !description.trim()}
                  className="bg-primary text-on-primary flex items-center gap-4 px-10 py-4 rounded-xl font-bold transition-all disabled:opacity-50 hover:brightness-110 shadow-lg shadow-primary/20"
                >
                  {loading ? "Analyzing..." : "Generate Architecture"}
                  <span className="material-symbols-outlined">bolt</span>
                </button>
              </div>
            </div>
          </form>

          <div className="mt-12 w-full">
            <p className="text-label-caps text-on-surface-variant mb-6 uppercase tracking-[0.2em]">
              Inspiration
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {INSPIRATION.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setDescription(chip)}
                  className="px-6 py-2.5 bg-white border border-outline-variant rounded-full text-secondary font-medium text-body-sm hover:border-primary hover:text-primary transition-all shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <section className="mt-28 w-full text-left">
            <p className="text-label-caps text-on-surface-variant mb-8 uppercase tracking-[0.2em] text-center">
              Learning Resources
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <a
                href="/learn/govcloud-basics"
                className="bg-surface border border-outline-variant rounded-2xl p-8 flex gap-6 items-start group hover:border-primary transition-all shadow-sm"
              >
                <div className="w-16 h-16 bg-secondary-container rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-container text-3xl">
                    play_circle
                  </span>
                </div>
                <div>
                  <h4 className="font-display text-xl mb-2 font-bold text-secondary">
                    GovCloud Basics
                  </h4>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">
                    Learn regions, compliance boundaries, and how GovCloud differs from commercial AWS.
                  </p>
                </div>
              </a>
              <a
                href="/learn/fedramp-concepts"
                className="bg-surface border border-outline-variant rounded-2xl p-8 flex gap-6 items-start group hover:border-primary transition-all shadow-sm"
              >
                <div className="w-16 h-16 bg-secondary-container rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-container text-3xl">
                    security
                  </span>
                </div>
                <div>
                  <h4 className="font-display text-xl mb-2 font-bold text-secondary">
                    FedRAMP Concepts
                  </h4>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">
                    Understand authorization levels, encryption requirements, and audit logging.
                  </p>
                </div>
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
