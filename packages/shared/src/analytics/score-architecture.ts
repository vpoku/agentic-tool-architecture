import type {
  ArchitectureProposal,
  ArchitectureScore,
  DataFlowStep,
  ServiceRationale,
} from "../schemas/architecture.js";

const PLAIN_ENGLISH: Record<string, string> = {
  "AWS Lambda":
    "Lambda is serverless — AWS automatically runs your code whenever a document arrives, without needing a permanent server.",
  "Amazon S3":
    "S3 is object storage — files are stored durably and encrypted, with no servers to manage.",
  "Amazon OpenSearch Service":
    "OpenSearch indexes your documents so employees can search by keyword, metadata, or full text in seconds.",
  "Amazon Bedrock":
    "Bedrock provides managed AI models for semantic search, summarization, and natural-language Q&A over your documents.",
  "Amazon API Gateway":
    "API Gateway is the front door — it accepts HTTPS uploads from employees and routes them to the right backend.",
  "Amazon SQS":
    "SQS is a message queue — it decouples upload from processing so spikes in traffic don't overwhelm downstream services.",
  "Amazon DynamoDB":
    "DynamoDB stores document metadata (who uploaded, when, classification level) with millisecond lookups at any scale.",
  "AWS KMS":
    "KMS manages encryption keys in FIPS 140-2 validated hardware — required for classified and FedRAMP workloads.",
  "Amazon CloudWatch":
    "CloudWatch collects logs and metrics for audit trails and alerting when something goes wrong.",
  "Amazon Route 53":
    "Route 53 is DNS — it directs users to your GovCloud endpoints with health checks and failover.",
  "Amazon CloudFront":
    "CloudFront is a CDN — it terminates TLS at the edge and speeds up document downloads for remote employees.",
};

function clampScore(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function scoreArchitecture(architecture: ArchitectureProposal): ArchitectureScore {
  const { compliance, services, costEstimate } = architecture;

  let security = 4;
  const criticalFlags = compliance.flags.filter((f) => f.severity === "critical").length;
  const warningFlags = compliance.flags.filter((f) => f.severity === "warning").length;
  security -= criticalFlags * 1.5 + warningFlags * 0.5;

  const hasKms = services.some((s) => s.data.service.includes("KMS"));
  const hasEncryption = services.some(
    (s) =>
      s.data.service.includes("S3") ||
      s.data.description?.toLowerCase().includes("encrypt")
  );
  if (hasKms) security += 0.5;
  if (hasEncryption) security += 0.3;
  if (compliance.framework === "FedRAMP" || compliance.framework === "ITAR") security += 0.3;

  const ratings = services
    .map((s) => s.data.scalabilityRating)
    .filter(Boolean) as Array<"low" | "medium" | "high">;
  const highCount = ratings.filter((r) => r === "high").length;
  const lowCount = ratings.filter((r) => r === "low").length;
  let scalability = ratings.length
    ? 2 + (highCount / ratings.length) * 2.5 - (lowCount / ratings.length) * 1
    : 3.5;
  if (services.some((s) => s.data.service.includes("Lambda"))) scalability += 0.3;
  if (services.some((s) => s.data.service.includes("SQS"))) scalability += 0.2;

  const monthlyMid =
    (costEstimate.monthlyTotalLow + costEstimate.monthlyTotalHigh) / 2;
  let cost: number;
  if (monthlyMid < 500) cost = 5;
  else if (monthlyMid < 1500) cost = 4;
  else if (monthlyMid < 4000) cost = 3;
  else if (monthlyMid < 8000) cost = 2;
  else cost = 1;

  const serverlessCount = services.filter(
    (s) =>
      s.data.service.includes("Lambda") ||
      s.data.service.includes("SQS") ||
      s.data.service.includes("DynamoDB")
  ).length;
  if (serverlessCount >= 3) cost += 0.3;

  return {
    security: clampScore(security),
    scalability: clampScore(scalability),
    cost: clampScore(cost),
    securityNotes:
      criticalFlags > 0
        ? `${criticalFlags} compliance item(s) need attention before production.`
        : "Strong GovCloud security posture with encryption and audit logging.",
    scalabilityNotes: `Designed for ${String(costEstimate.assumptions.documentsPerDay ?? "high-volume")} docs/day with auto-scaling serverless components.`,
    costNotes: `Estimated $${costEstimate.monthlyTotalLow.toFixed(0)}–$${costEstimate.monthlyTotalHigh.toFixed(0)}/month. ${costEstimate.costDrivers[0] ?? "Optimize with reserved capacity where steady-state."}`,
  };
}

export function buildDataFlow(architecture: ArchitectureProposal): {
  narrative: string;
  steps: DataFlowStep[];
} {
  const labelById = new Map(architecture.services.map((s) => [s.id, s.data.label]));

  const steps: DataFlowStep[] = architecture.connections.map((edge) => {
    const from = labelById.get(edge.source) ?? edge.source;
    const to = labelById.get(edge.target) ?? edge.target;
    const targetNode = architecture.services.find((s) => s.id === edge.target);
    const explanation =
      targetNode?.data.aiRecommendation ??
      targetNode?.data.description ??
      `Data flows from ${from} to ${to}${edge.label ? ` (${edge.label})` : ""}.`;
    return { from, to, label: edge.label, explanation };
  });

  const flowChain = architecture.services.map((s) => s.data.label).join(" → ");
  const narrative = `Your data flows through ${architecture.services.length} GovCloud services: ${flowChain}. Each step is designed for ${architecture.compliance.framework} compliance in us-gov-west-1.`;

  return { narrative, steps };
}

export function buildServiceRationales(
  architecture: ArchitectureProposal
): ServiceRationale[] {
  return architecture.services.map((node) => ({
    serviceId: node.id,
    serviceName: node.data.label,
    whyChosen:
      node.data.aiRecommendation ??
      node.data.description ??
      `${node.data.label} supports the ${node.data.category.toLowerCase()} layer of this architecture.`,
    plainEnglish:
      PLAIN_ENGLISH[node.data.service] ??
      `${node.data.label} handles ${node.data.category.toLowerCase()} responsibilities in your GovCloud pipeline.`,
  }));
}

export function enrichArchitectureMetadata(
  architecture: ArchitectureProposal
): ArchitectureProposal {
  const withAnalytics = architecture;
  return {
    ...withAnalytics,
    scores: scoreArchitecture(withAnalytics),
    dataFlow: buildDataFlow(withAnalytics),
    serviceRationales: buildServiceRationales(withAnalytics),
  };
}
