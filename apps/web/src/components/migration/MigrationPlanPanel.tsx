import type { MigrationPlan } from "@cloudarch/shared";

export function MigrationPlanPanel({ plan }: { plan: MigrationPlan }) {
  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-muted leading-relaxed">{plan.summary}</p>
      {plan.phases.map((phase, i) => (
        <div key={phase.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{phase.title}</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">{phase.description}</p>
              <p className="text-[10px] font-bold text-muted uppercase mt-3 mb-1">Tasks</p>
              <ul className="space-y-1">
                {phase.tasks.map((task, j) => (
                  <li key={j} className="text-xs text-foreground">
                    · {task}
                  </li>
                ))}
              </ul>
              {phase.risks && phase.risks.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-muted uppercase mt-3 mb-1">Risks</p>
                  <ul className="space-y-1">
                    {phase.risks.map((risk, j) => (
                      <li key={j} className="text-xs text-amber-700">
                        ⚠ {risk}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
