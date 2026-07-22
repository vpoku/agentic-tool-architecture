import type { ArchitectureProposal } from "../schemas/architecture.js";
import type { AzureArchitecture } from "../schemas/azure-architecture.js";
import type { MigrationCostRange, MigrationMetricsAnalysis } from "../schemas/migration-metrics.js";
import type { ServiceMapping } from "../schemas/service-mapping.js";

function clampScore(value: number): 1 | 2 | 3 | 4 | 5 {
  return Math.min(5, Math.max(1, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
}

function estimateAzureBaseline(azure: AzureArchitecture): MigrationCostRange {
  const componentCount = azure.components.length;
  const users = azure.expectedUsers ?? 1000;
  const baseLow = 400 + componentCount * 120 + users * 0.05;
  const baseHigh = baseLow * 2.2;

  const assumptions = [
    `Estimated from ${componentCount} detected Azure services`,
    users > 0 ? `~${users.toLocaleString()} expected users` : "Default user scale assumed",
    "Azure pricing is approximate — verify with Azure Pricing Calculator",
  ];

  if (azure.complianceRequirements.length) {
    assumptions.push(`Compliance overhead: ${azure.complianceRequirements.join(", ")}`);
  }

  return {
    monthlyLow: Math.round(baseLow),
    monthlyHigh: Math.round(baseHigh),
    assumptions,
  };
}

function buildWorkloadMetrics(
  azure: AzureArchitecture,
  mappings: ServiceMapping[]
): MigrationMetricsAnalysis["workloadMetrics"] {
  const metrics: MigrationMetricsAnalysis["workloadMetrics"] = [];

  for (const comp of azure.components) {
    const mapping = mappings.find((m) => m.id === comp.id || m.azureService === comp.service);
    metrics.push({
      label: comp.service,
      azureValue: comp.purpose,
      awsTarget: mapping?.awsGovCloudEquivalent ?? "To be determined",
    });
  }

  if (azure.expectedUsers) {
    metrics.push({
      label: "Expected users",
      azureValue: azure.expectedUsers.toLocaleString(),
      awsTarget: "Same scale on GovCloud with auto-scaling",
    });
  }

  if (azure.availabilityRequirements) {
    metrics.push({
      label: "Availability",
      azureValue: azure.availabilityRequirements,
      awsTarget: "Multi-AZ GovCloud deployment",
    });
  }

  if (azure.complianceRequirements.length) {
    metrics.push({
      label: "Compliance",
      azureValue: azure.complianceRequirements.join(", "),
      awsTarget: "FedRAMP-aligned GovCloud controls",
    });
  }

  return metrics;
}

function computeComplexity(azure: AzureArchitecture, mappings: ServiceMapping[]): 1 | 2 | 3 | 4 | 5 {
  let score = 2;
  score += Math.min(2, azure.components.length * 0.3);
  const categories = new Set(azure.components.map((c) => c.category));
  score += categories.size * 0.25;
  const lowConfidence = mappings.filter((m) => m.confidence !== "high").length;
  score += lowConfidence * 0.5;
  if (azure.complianceRequirements.some((c) => /fedramp|itar|hipaa/i.test(c))) score += 0.5;
  return clampScore(score);
}

function computeReadiness(
  azure: AzureArchitecture,
  target: ArchitectureProposal,
  mappings: ServiceMapping[]
): 1 | 2 | 3 | 4 | 5 {
  let score = 3;
  if (mappings.length >= azure.components.length) score += 0.5;
  if (target.scores?.security && target.scores.security >= 4) score += 0.5;
  if (azure.summary.length > 100) score += 0.3;
  const hasIdentity = azure.components.some((c) =>
    c.service.toLowerCase().includes("active directory")
  );
  if (hasIdentity && mappings.some((m) => m.awsService.toLowerCase().includes("cognito"))) {
    score += 0.4;
  }
  const criticalFlags = target.compliance.flags.filter((f) => f.severity === "critical").length;
  score -= criticalFlags * 0.8;
  return clampScore(score);
}

export function computeMigrationMetrics(
  azure: AzureArchitecture,
  mappings: ServiceMapping[],
  targetArchitecture: ArchitectureProposal
): MigrationMetricsAnalysis {
  const azureBaselineCost = estimateAzureBaseline(azure);
  const awsTargetCost = {
    monthlyLow: targetArchitecture.costEstimate.monthlyTotalLow,
    monthlyHigh: targetArchitecture.costEstimate.monthlyTotalHigh,
  };

  const azureMid = (azureBaselineCost.monthlyLow + azureBaselineCost.monthlyHigh) / 2;
  const awsMid = (awsTargetCost.monthlyLow + awsTargetCost.monthlyHigh) / 2;
  const costDeltaPercent =
    azureMid > 0 ? Math.round(((awsMid - azureMid) / azureMid) * 100) : undefined;

  return {
    azureBaselineCost,
    awsTargetCost,
    costDeltaPercent,
    complexityScore: computeComplexity(azure, mappings),
    readinessScore: computeReadiness(azure, targetArchitecture, mappings),
    workloadMetrics: buildWorkloadMetrics(azure, mappings),
  };
}
