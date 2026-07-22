import { z } from "zod";

export const MigrationCostRangeSchema = z.object({
  monthlyLow: z.number(),
  monthlyHigh: z.number(),
  assumptions: z.array(z.string()).default([]),
});

export const WorkloadMetricSchema = z.object({
  label: z.string(),
  azureValue: z.string(),
  awsTarget: z.string(),
});

export const MigrationMetricsAnalysisSchema = z.object({
  azureBaselineCost: MigrationCostRangeSchema.optional(),
  awsTargetCost: z.object({
    monthlyLow: z.number(),
    monthlyHigh: z.number(),
  }),
  costDeltaPercent: z.number().optional(),
  complexityScore: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  readinessScore: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  workloadMetrics: z.array(WorkloadMetricSchema),
});

export type MigrationCostRange = z.infer<typeof MigrationCostRangeSchema>;
export type WorkloadMetric = z.infer<typeof WorkloadMetricSchema>;
export type MigrationMetricsAnalysis = z.infer<typeof MigrationMetricsAnalysisSchema>;
