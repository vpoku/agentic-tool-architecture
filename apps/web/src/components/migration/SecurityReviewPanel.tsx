import type { SecurityReview } from "@cloudarch/shared";

const SEVERITY_STYLES = {
  good: "text-success border-success/30 bg-success/5",
  attention: "text-amber-600 border-amber-500/30 bg-amber-500/5",
  critical: "text-danger border-danger/30 bg-danger/5",
};

const SEVERITY_ICON = {
  good: "✓",
  attention: "⚠",
  critical: "✕",
};

export function SecurityReviewPanel({ review }: { review: SecurityReview }) {
  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-muted leading-relaxed px-1">{review.summary}</p>
      {review.findings.map((f) => (
        <div
          key={f.id}
          className={`rounded-xl border p-4 ${SEVERITY_STYLES[f.severity]}`}
        >
          <div className="flex items-start gap-2">
            <span className="font-bold text-sm">{SEVERITY_ICON[f.severity]}</span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted mb-0.5">
                {f.domain}
              </p>
              <p className="text-sm font-semibold text-foreground">{f.title}</p>
              <p className="text-xs text-muted mt-1 leading-relaxed">{f.description}</p>
              {f.recommendation && (
                <p className="text-xs mt-2 font-medium">{f.recommendation}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
