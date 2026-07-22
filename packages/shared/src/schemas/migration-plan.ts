import { z } from "zod";

export const MigrationPhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tasks: z.array(z.string()),
  risks: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
});

export const MigrationPlanSchema = z.object({
  summary: z.string(),
  phases: z.array(MigrationPhaseSchema),
});

export type MigrationPhase = z.infer<typeof MigrationPhaseSchema>;
export type MigrationPlan = z.infer<typeof MigrationPlanSchema>;
