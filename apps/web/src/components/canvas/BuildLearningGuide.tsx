"use client";

import type { ArchitectureProposal } from "@cloudarch/shared";

interface BuildLearningGuideProps {
  architecture: ArchitectureProposal;
}

export function BuildLearningGuide({ architecture }: BuildLearningGuideProps) {
  const rationales = architecture.serviceRationales ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div>
        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">
          Learning guide
        </p>
        <h3 className="text-sm font-semibold text-foreground">
          Learn why each AWS service was chosen
        </h3>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          New to AWS? Each service below is explained in plain English — perfect for students and
          first-time architects building on GovCloud.
        </p>
      </div>

      {architecture.dataFlow?.narrative && (
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-[10px] font-bold text-muted uppercase mb-1">How data flows</p>
          <p className="text-xs text-foreground leading-relaxed">
            {architecture.dataFlow.narrative}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {rationales.length > 0 ? (
          rationales.map((r) => (
            <details
              key={r.serviceId}
              className="rounded-lg border border-border bg-background group"
              open
            >
              <summary className="px-3 py-2.5 text-sm font-medium text-foreground cursor-pointer list-none flex items-center justify-between">
                {r.serviceName}
                <span className="text-[10px] text-muted group-open:hidden">Show</span>
              </summary>
              <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                <p className="text-xs text-muted leading-relaxed">{r.plainEnglish}</p>
                <p className="text-xs text-foreground leading-relaxed">{r.whyChosen}</p>
              </div>
            </details>
          ))
        ) : (
          architecture.services.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-background p-3">
              <p className="text-sm font-medium text-foreground">{s.data.label}</p>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {s.data.aiRecommendation ?? s.data.description ?? "GovCloud-managed service."}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
