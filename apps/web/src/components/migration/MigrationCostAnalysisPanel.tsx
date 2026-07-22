"use client";

import type { MigrationMetricsAnalysis } from "@cloudarch/shared";

interface MigrationCostAnalysisPanelProps {
  metrics: MigrationMetricsAnalysis;
  awsScoresCost?: number;
}

export function MigrationCostAnalysisPanel({
  metrics,
  awsScoresCost,
}: MigrationCostAnalysisPanelProps) {
  const { azureBaselineCost, awsTargetCost, costDeltaPercent } = metrics;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div>
        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">
          Cost analysis
        </p>
        <p className="text-xs text-muted">
          Estimated monthly run cost for Azure (baseline) vs AWS GovCloud (target). Verify with
          official pricing calculators before budgeting.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {azureBaselineCost && (
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-[10px] text-muted uppercase mb-1">Azure baseline (est.)</p>
            <p className="text-lg font-semibold text-foreground">
              ${azureBaselineCost.monthlyLow.toLocaleString()}–$
              {azureBaselineCost.monthlyHigh.toLocaleString()}
              <span className="text-xs font-normal text-muted">/mo</span>
            </p>
          </div>
        )}
        <div className="rounded-lg border border-accent/30 bg-accent-muted/20 p-3">
          <p className="text-[10px] text-accent uppercase mb-1">AWS GovCloud target</p>
          <p className="text-lg font-semibold text-foreground">
            ${awsTargetCost.monthlyLow.toLocaleString()}–$
            {awsTargetCost.monthlyHigh.toLocaleString()}
            <span className="text-xs font-normal text-muted">/mo</span>
          </p>
          {costDeltaPercent !== undefined && (
            <p className="text-xs text-muted mt-1">
              {costDeltaPercent >= 0 ? "+" : ""}
              {costDeltaPercent}% vs Azure baseline (midpoint estimate)
            </p>
          )}
        </div>
      </div>

      {awsScoresCost !== undefined && (
        <p className="text-xs text-muted">
          Architecture cost efficiency score: {awsScoresCost}/5 stars
        </p>
      )}

      {azureBaselineCost?.assumptions && (
        <ul className="text-xs text-muted space-y-1 list-disc list-inside">
          {azureBaselineCost.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
