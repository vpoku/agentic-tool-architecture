import type { ArchitectureProposal } from "@cloudarch/shared";

interface ArchitectureInsightsProps {
  architecture: ArchitectureProposal;
}

export function ArchitectureInsights({ architecture }: ArchitectureInsightsProps) {
  const { dataFlow, serviceRationales, alternatives, tradeoffs, costEstimate } = architecture;

  return (
    <div className="space-y-4 mt-4">
      {/* Data flow */}
      {dataFlow && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-2">
            Data flow
          </p>
          <p className="text-xs text-muted mb-3 leading-relaxed">{dataFlow.narrative}</p>
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {architecture.services.map((s, i) => (
              <span key={s.id} className="flex items-center gap-1.5">
                <span className="text-xs font-medium px-2 py-1 rounded-md bg-background border border-border">
                  {s.data.label}
                </span>
                {i < architecture.services.length - 1 && (
                  <span className="text-muted text-xs">→</span>
                )}
              </span>
            ))}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {dataFlow.steps.slice(0, 6).map((step, i) => (
              <div key={i} className="text-xs border-l-2 border-accent/30 pl-3 py-0.5">
                <span className="font-medium text-foreground">
                  {step.from} → {step.to}
                  {step.label ? ` (${step.label})` : ""}
                </span>
                <p className="text-muted mt-0.5 leading-relaxed">{step.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why each service */}
      {serviceRationales && serviceRationales.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-3">
            Why each service was chosen
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {serviceRationales.map((r) => (
              <div key={r.serviceId} className="rounded-lg bg-background border border-border p-3">
                <p className="text-sm font-semibold text-foreground mb-1">{r.serviceName}</p>
                <p className="text-xs text-muted leading-relaxed mb-2">{r.whyChosen}</p>
                <p className="text-[11px] text-accent/90 leading-relaxed italic">{r.plainEnglish}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost + alternatives row */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-2">
            Estimated monthly cost
          </p>
          <p className="text-2xl font-semibold text-foreground">
            ${costEstimate.monthlyTotalLow.toFixed(0)}–${costEstimate.monthlyTotalHigh.toFixed(0)}
            <span className="text-sm font-normal text-muted">/mo</span>
          </p>
          <ul className="mt-2 space-y-1">
            {costEstimate.costDrivers.slice(0, 3).map((d, i) => (
              <li key={i} className="text-xs text-muted">
                · {d}
              </li>
            ))}
          </ul>
        </div>

        {alternatives.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-2">
              Alternatives considered
            </p>
            {alternatives.map((alt) => (
              <div key={alt.id} className="mb-3 last:mb-0">
                <p className="text-xs font-medium text-foreground mb-1">{alt.title}</p>
                <p className="text-xs text-muted leading-relaxed">{alt.verdict}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tradeoffs */}
      {tradeoffs.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-3">
            Tradeoffs
          </p>
          {tradeoffs.map((t, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-sm font-medium text-foreground mb-1">{t.title}</p>
              <p className="text-xs text-muted leading-relaxed">{t.recommendation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
