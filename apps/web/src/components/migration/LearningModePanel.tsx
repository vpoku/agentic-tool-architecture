"use client";

import { useState } from "react";
import type { LearningExplanation } from "@cloudarch/shared";

type Tier = "beginner" | "architect" | "interview";

const TIERS: { id: Tier; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "architect", label: "Architect" },
  { id: "interview", label: "Interview" },
];

export function LearningModePanel({ learning }: { learning: LearningExplanation[] }) {
  const [tier, setTier] = useState<Tier>("beginner");
  const [selected, setSelected] = useState(learning[0]?.serviceId);

  const active = learning.find((l) => l.serviceId === selected) ?? learning[0];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex gap-1 p-3 border-b border-border">
        {TIERS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTier(t.id)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              tier === t.id
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground hover:bg-background"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="w-36 border-r border-border overflow-y-auto scrollbar-thin p-2">
          {learning.map((l) => (
            <button
              key={l.serviceId}
              onClick={() => setSelected(l.serviceId)}
              className={`w-full text-left text-xs px-2 py-2 rounded-lg mb-0.5 transition-colors ${
                selected === l.serviceId
                  ? "bg-accent-muted text-accent font-medium"
                  : "text-muted hover:bg-background"
              }`}
            >
              {l.serviceName}
            </button>
          ))}
        </div>
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
          {active && (
            <>
              <h3 className="text-sm font-semibold text-foreground">{active.serviceName}</h3>
              {active.azureSource && (
                <p className="text-xs text-muted mt-1">
                  Replaces <span className="text-accent">{active.azureSource}</span>
                </p>
              )}
              <div className="mt-4 rounded-xl bg-background border border-border p-4">
                <p className="text-[10px] font-bold text-accent uppercase mb-2">
                  {TIERS.find((t) => t.id === tier)?.label} explanation
                </p>
                <p className="text-sm text-foreground leading-relaxed">{active[tier]}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
