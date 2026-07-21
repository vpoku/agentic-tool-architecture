import type { ArchitectureScore } from "@cloudarch/shared";

function StarRating({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs tracking-wider" aria-label={`${label}: ${score} out of 5`}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < score ? "text-amber-500" : "text-border"}>
              ★
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

interface ArchitectureReportCardProps {
  scores: ArchitectureScore;
  compact?: boolean;
}

export function ArchitectureReportCard({ scores, compact = false }: ArchitectureReportCardProps) {
  const notes = compact
    ? null
    : [
        { label: "Security", note: scores.securityNotes },
        { label: "Scalability", note: scores.scalabilityNotes },
        { label: "Cost", note: scores.costNotes },
      ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-3">
        Architecture report card
      </p>
      <div className="space-y-2.5">
        <StarRating score={scores.security} label="Security" />
        <StarRating score={scores.scalability} label="Scalability" />
        <StarRating score={scores.cost} label="Cost" />
      </div>
      {notes && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          {notes.map(({ label, note }) =>
            note ? (
              <p key={label} className="text-[11px] text-muted leading-relaxed">
                <span className="font-medium text-foreground">{label}:</span> {note}
              </p>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
