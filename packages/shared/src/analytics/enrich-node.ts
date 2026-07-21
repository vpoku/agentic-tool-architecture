import type { ArchitectureProposal, ServiceNode } from "../schemas/architecture.js";

const SERVICE_CAPACITY: Record<
  string,
  { label: string; value: string; detail: string; rating: "low" | "medium" | "high" }
> = {
  "Amazon S3": {
    label: "Storage throughput",
    value: "10k+ objects/day",
    detail: "Scales horizontally; no hard object limit per bucket",
    rating: "high",
  },
  "AWS Lambda": {
    label: "Concurrent executions",
    value: "1,000 default (soft limit)",
    detail: "Request limit increase for burst workloads above 10k docs/day",
    rating: "high",
  },
  "Amazon API Gateway": {
    label: "Request rate",
    value: "10,000 RPS (default)",
    detail: "Throttling limits apply per account and stage",
    rating: "high",
  },
  "Amazon DynamoDB": {
    label: "Read/write capacity",
    value: "On-demand auto-scales",
    detail: "Handles millions of items; partition key design matters",
    rating: "high",
  },
  "Amazon SQS": {
    label: "Queue throughput",
    value: "Unlimited messages",
    detail: "Standard queue: nearly unlimited TPS with batching",
    rating: "high",
  },
  "AWS KMS": {
    label: "API requests",
    value: "Varies by key type",
    detail: "CMK requests are rate-limited; use data keys for high volume",
    rating: "medium",
  },
  "Amazon CloudWatch": {
    label: "Log ingestion",
    value: "5 GB/month typical starter",
    detail: "Scale retention to 1 year for FedRAMP audit requirements",
    rating: "medium",
  },
  "Amazon Route 53": {
    label: "Query volume",
    value: "Unlimited with health checks",
    detail: "Latency-based routing available in GovCloud",
    rating: "high",
  },
  "Amazon CloudFront": {
    label: "Data transfer",
    value: "Pay per GB out",
    detail: "Reduces origin load for document downloads",
    rating: "high",
  },
};

function serviceKey(name: string): string {
  return name.toLowerCase().split(/\s+/).pop() ?? name.toLowerCase();
}

function matchCostForService(serviceName: string, architecture: ArchitectureProposal) {
  const key = serviceKey(serviceName);
  return architecture.costEstimate.lineItems.filter((item) =>
    item.service.toLowerCase().includes(key)
  );
}

export function enrichNodeAnalytics(
  node: ServiceNode,
  architecture: ArchitectureProposal
): ServiceNode {
  const costItems = matchCostForService(node.data.service, architecture);
  const monthlyCostLow =
    costItems.reduce((sum, i) => sum + i.monthlyLow, 0) ||
    architecture.costEstimate.monthlyTotalLow * 0.05;
  const monthlyCostHigh =
    costItems.reduce((sum, i) => sum + i.monthlyHigh, 0) ||
    architecture.costEstimate.monthlyTotalHigh * 0.15;

  const capacity = SERVICE_CAPACITY[node.data.service] ?? {
    label: "Workload fit",
    value: "Scales with demand",
    detail: "Sizing depends on intake volume and retention policy",
    rating: "medium" as const,
  };

  const docsPerDay = Number(architecture.costEstimate.assumptions.documentsPerDay ?? 10_000);

  return {
    ...node,
    data: {
      ...node.data,
      monthlyCostLow: node.data.monthlyCostLow ?? monthlyCostLow,
      monthlyCostHigh: node.data.monthlyCostHigh ?? monthlyCostHigh,
      scalabilityLabel:
        node.data.scalabilityLabel ??
        (node.data.category === "Compute"
          ? `${docsPerDay.toLocaleString()} events/day`
          : capacity.value),
      scalabilityDetail: node.data.scalabilityDetail ?? capacity.detail,
      scalabilityRating: node.data.scalabilityRating ?? capacity.rating,
    },
  };
}

export function enrichArchitectureAnalytics(
  architecture: ArchitectureProposal
): ArchitectureProposal {
  return {
    ...architecture,
    services: architecture.services.map((node) => enrichNodeAnalytics(node, architecture)),
  };
}

export { SERVICE_CAPACITY };
