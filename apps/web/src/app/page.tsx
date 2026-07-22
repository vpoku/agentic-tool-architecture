"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

export default function HomePage() {
  return (
    <AppShell>
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-3">
            Let&apos;s Bring Your Story to Life
          </h1>
          <p className="text-muted text-sm sm:text-base mb-8 leading-relaxed max-w-lg mx-auto">
            Describe what you want to build and AI generates a complete AWS GovCloud architecture
            — instantly. Every design becomes part of your portfolio.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Link
              href="/app"
              className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Start Building
            </Link>
            <Link
              href="/migration"
              className="text-sm font-medium text-muted border border-border hover:border-accent hover:text-accent px-6 py-3 rounded-lg transition-colors"
            >
              Azure Migration
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              { step: "1", title: "Describe", desc: "Tell the AI what to build" },
              { step: "2", title: "Thinking", desc: "CloudArch analyzes your idea" },
              { step: "3", title: "Review", desc: "Explore costs and rationale" },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-border bg-card p-4">
                <span className="text-xs font-bold text-accent">{item.step}</span>
                <p className="text-sm font-semibold mt-1">{item.title}</p>
                <p className="text-xs text-muted mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
