"use client";

import type { MigrationMetricsAnalysis } from "@cloudarch/shared";

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="font-medium text-foreground">{score}/5</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

interface MigrationMetricsAnalysisPanelProps {
  metrics: MigrationMetricsAnalysis;
}

export function MigrationMetricsAnalysisPanel({ metrics }: MigrationMetricsAnalysisPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div>
        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">
          Metrics analysis
        </p>
        <p className="text-xs text-muted">
          Migration complexity and readiness scores based on your Azure workload and target GovCloud
          design.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ScoreBar label="Complexity" score={metrics.complexityScore} />
        <ScoreBar label="Readiness" score={metrics.readinessScore} />
      </div>

      {metrics.workloadMetrics.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-2 pr-3 font-medium">Metric</th>
                <th className="pb-2 pr-3 font-medium">Azure (current)</th>
                <th className="pb-2 font-medium">AWS GovCloud (target)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.workloadMetrics.map((row) => (
                <tr key={row.label} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-3 font-medium text-foreground">{row.label}</td>
                  <td className="py-2 pr-3 text-muted">{row.azureValue}</td>
                  <td className="py-2 text-foreground">{row.awsTarget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
