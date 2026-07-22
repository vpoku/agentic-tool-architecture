import { z } from "zod";
import { MigrationAssessmentSchema } from "./migration-assessment.js";

export const ComplianceFrameworkSchema = z.enum([
  "FedRAMP",
  "ITAR",
  "HIPAA",
  "None",
]);

export const ComplianceFlagSchema = z.object({
  id: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  title: z.string(),
  description: z.string(),
  remediation: z.string().optional(),
});

export const ServiceNodeSchema = z.object({
  id: z.string(),
  type: z.string().default("awsService"),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({
    label: z.string(),
    service: z.string(),
    category: z.string(),
    description: z.string().optional(),
    govcloudAvailable: z.boolean().default(true),
    docsUrl: z.string().optional(),
    aiRecommendation: z.string().optional(),
    ragSource: z.string().optional(),
    monthlyCostLow: z.number().optional(),
    monthlyCostHigh: z.number().optional(),
    scalabilityLabel: z.string().optional(),
    scalabilityDetail: z.string().optional(),
    scalabilityRating: z.enum(["low", "medium", "high"]).optional(),
  }),
});

export const ServiceEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  animated: z.boolean().optional(),
});

export const TradeoffSchema = z.object({
  title: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  recommendation: z.string(),
});

export const CostLineItemSchema = z.object({
  service: z.string(),
  description: z.string(),
  monthlyLow: z.number(),
  monthlyHigh: z.number(),
  unit: z.string().optional(),
  quantity: z.number().optional(),
});

export const CostBreakdownSchema = z.object({
  lineItems: z.array(CostLineItemSchema),
  monthlyTotalLow: z.number(),
  monthlyTotalHigh: z.number(),
  assumptions: z.record(z.union([z.string(), z.number()])),
  costDrivers: z.array(z.string()),
});

export const ServiceComparisonSchema = z.object({
  id: z.string(),
  title: z.string(),
  services: z.array(
    z.object({
      name: z.string(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      bestFor: z.string(),
      govcloudNotes: z.string().optional(),
    })
  ),
  verdict: z.string(),
});

export const GeneratedIacSchema = z.object({
  cdk: z.string(),
  deployScript: z.string(),
  readme: z.string(),
  copilotPrompt: z.string(),
});

export const ArchitectureScoreSchema = z.object({
  security: z.number().min(1).max(5),
  scalability: z.number().min(1).max(5),
  cost: z.number().min(1).max(5),
  securityNotes: z.string().optional(),
  scalabilityNotes: z.string().optional(),
  costNotes: z.string().optional(),
});

export const DataFlowStepSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  explanation: z.string(),
});

export const ServiceRationaleSchema = z.object({
  serviceId: z.string(),
  serviceName: z.string(),
  whyChosen: z.string(),
  plainEnglish: z.string(),
});

export const ArchitectureProposalSchema = z.object({
  projectId: z.string(),
  summary: z.string(),
  compliance: z.object({
    framework: ComplianceFrameworkSchema,
    level: z.string(),
    flags: z.array(ComplianceFlagSchema),
  }),
  services: z.array(ServiceNodeSchema),
  connections: z.array(ServiceEdgeSchema),
  tradeoffs: z.array(TradeoffSchema),
  costEstimate: CostBreakdownSchema,
  alternatives: z.array(ServiceComparisonSchema),
  generatedIac: GeneratedIacSchema.optional(),
  ragInsights: z.array(z.string()).optional(),
  scores: ArchitectureScoreSchema.optional(),
  dataFlow: z
    .object({
      narrative: z.string(),
      steps: z.array(DataFlowStepSchema),
    })
    .optional(),
  serviceRationales: z.array(ServiceRationaleSchema).optional(),
});

export const ProjectSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string(),
  complianceLevel: z.string().default("FedRAMP High"),
  projectType: z.enum(["architecture", "migration"]).default("architecture"),
  status: z.enum(["draft", "analyzing", "ready", "exported"]).default("draft"),
  architecture: ArchitectureProposalSchema.optional(),
  migrationAssessment: MigrationAssessmentSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ChatMessageSchema = z.object({
  projectId: z.string(),
  messageId: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.string(),
});

export type ComplianceFramework = z.infer<typeof ComplianceFrameworkSchema>;
export type ComplianceFlag = z.infer<typeof ComplianceFlagSchema>;
export type ServiceNode = z.infer<typeof ServiceNodeSchema>;
export type ServiceEdge = z.infer<typeof ServiceEdgeSchema>;
export type Tradeoff = z.infer<typeof TradeoffSchema>;
export type CostLineItem = z.infer<typeof CostLineItemSchema>;
export type CostBreakdown = z.infer<typeof CostBreakdownSchema>;
export type ServiceComparison = z.infer<typeof ServiceComparisonSchema>;
export type GeneratedIac = z.infer<typeof GeneratedIacSchema>;
export type ArchitectureScore = z.infer<typeof ArchitectureScoreSchema>;
export type DataFlowStep = z.infer<typeof DataFlowStepSchema>;
export type ServiceRationale = z.infer<typeof ServiceRationaleSchema>;
export type ArchitectureProposal = z.infer<typeof ArchitectureProposalSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
