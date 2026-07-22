import { z } from "zod";
import { AzureArchitectureSchema } from "./azure-architecture.js";
import { ServiceMappingSchema } from "./service-mapping.js";
import { MigrationPlanSchema } from "./migration-plan.js";
import { SecurityReviewSchema } from "./security-review.js";
import { LearningExplanationSchema } from "./learning.js";
import { ArchitectureProposalSchema } from "./architecture.js";
import { MigrationMetricsAnalysisSchema } from "./migration-metrics.js";

export const MigrationAssessmentSchema = z.object({
  azureArchitecture: AzureArchitectureSchema,
  mappings: z.array(ServiceMappingSchema),
  targetArchitecture: ArchitectureProposalSchema,
  securityReview: SecurityReviewSchema,
  learning: z.array(LearningExplanationSchema),
  migrationPlan: MigrationPlanSchema,
  metricsAnalysis: MigrationMetricsAnalysisSchema,
  mermaidDiagram: z.string().optional(),
});

export type MigrationAssessment = z.infer<typeof MigrationAssessmentSchema>;
