import type { ArchitectureProposal, ServiceNode } from "@cloudarch/shared";

export interface ServiceInsight {
  node: ServiceNode;
  role: string;
  monthlyCostLow: number;
  monthlyCostHigh: number;
  capacity: {
    label: string;
    value: string;
    detail: string;
  };
  recommendations: string[];
  govcloudNotes: string[];
  relatedAlternatives: string[];
}

const SERVICE_META: Record<
  string,
  { role: string; capacity: ServiceInsight["capacity"]; notes: string[] }
> = {
  "Amazon S3": {
    role: "Object storage for uploads, documents, and static assets",
    capacity: {
      label: "Storage throughput",
      value: "10k+ objects/day",
      detail: "Scales horizontally; no hard object limit per bucket",
    },
    notes: ["SSE-KMS required for FedRAMP", "Block all public access", "Enable versioning for audit"],
  },
  "AWS Lambda": {
    role: "Event-driven compute for validation, transformation, and API handlers",
    capacity: {
      label: "Concurrent executions",
      value: "1,000 default (soft limit)",
      detail: "Request limit increase for burst workloads above 10k docs/day",
    },
    notes: ["Run in VPC for FedRAMP", "Use FIPS endpoints in SDK", "Set timeout above max processing time"],
  },
  "Amazon API Gateway": {
    role: "HTTPS entry point — authenticates and routes requests to backends",
    capacity: {
      label: "Request rate",
      value: "10,000 RPS (default)",
      detail: "Throttling limits apply per account and stage",
    },
    notes: ["TLS 1.2+ only", "Integrate with Cognito for auth", "Enable access logging"],
  },
  "Amazon DynamoDB": {
    role: "Metadata store for document index, status, and user references",
    capacity: {
      label: "Read/write capacity",
      value: "On-demand auto-scales",
      detail: "Handles millions of items; partition key design matters",
    },
    notes: ["Point-in-time recovery enabled", "KMS encryption at rest", "Avoid hot partitions"],
  },
  "Amazon SQS": {
    role: "Buffer queue to absorb intake spikes and decouple producers from processors",
    capacity: {
      label: "Queue throughput",
      value: "Unlimited messages",
      detail: "Standard queue: nearly unlimited TPS with batching",
    },
    notes: ["KMS-encrypted queues", "Set visibility timeout > processing time", "Use DLQ for failed messages"],
  },
  "AWS KMS": {
    role: "Encryption key management for data at rest across services",
    capacity: {
      label: "API requests",
      value: "Varies by key type",
      detail: "CMK requests are rate-limited; use data keys for high volume",
    },
    notes: ["FIPS 140-2 validated HSMs in GovCloud", "Rotate keys annually", "Least-privilege key policies"],
  },
  "Amazon CloudWatch": {
    role: "Logs, metrics, and alarms for observability and compliance evidence",
    capacity: {
      label: "Log ingestion",
      value: "5 GB/month typical starter",
      detail: "Scale retention to 1 year for FedRAMP audit requirements",
    },
    notes: ["Required for audit trails", "Set log retention policies", "Create alarms on error rates"],
  },
  "Amazon Route 53": {
    role: "DNS routing to your application endpoints",
    capacity: {
      label: "Query volume",
      value: "Unlimited with health checks",
      detail: "Latency-based routing available in GovCloud",
    },
    notes: ["Use private hosted zones in VPC", "Enable DNS query logging for compliance"],
  },
  "Amazon CloudFront": {
    role: "CDN for TLS termination and edge caching of static content",
    capacity: {
      label: "Data transfer",
      value: "Pay per GB out",
      detail: "Reduces origin load for document downloads",
    },
    notes: ["TLS 1.2 minimum", "Origin access control for S3", "Geo restrictions if required"],
  },
};

function normalizeServiceName(name: string): string {
  return name.trim();
}

function matchCostItems(serviceName: string, architecture: ArchitectureProposal) {
  const key = serviceName.toLowerCase();
  return architecture.costEstimate.lineItems.filter((item) =>
    item.service.toLowerCase().includes(key.split(" ")[0] ?? key)
  );
}

export function getServiceInsight(
  node: ServiceNode,
  architecture: ArchitectureProposal
): ServiceInsight {
  const serviceName = normalizeServiceName(node.data.service);
  const meta = SERVICE_META[serviceName];
  const costItems = matchCostItems(serviceName, architecture);

  const monthlyCostLow = costItems.reduce((sum, i) => sum + i.monthlyLow, 0);
  const monthlyCostHigh = costItems.reduce((sum, i) => sum + i.monthlyHigh, 0);

  const relatedAlternatives = architecture.alternatives
    .filter((alt) => alt.services.some((s) => s.name.includes(serviceName.split(" ")[1] ?? serviceName)))
    .map((alt) => `${alt.title}: ${alt.verdict}`);

  const recommendations = [
    node.data.description ?? meta?.role ?? "Core component of your GovCloud pipeline.",
    ...architecture.tradeoffs.slice(0, 1).map((t) => t.recommendation),
    ...(meta?.notes.slice(0, 2) ?? ["Verify service availability in us-gov-west-1"]),
  ];

  return {
    node,
    role: meta?.role ?? node.data.description ?? "AWS managed service in your architecture",
    monthlyCostLow:
      node.data.monthlyCostLow ??
      (monthlyCostLow || architecture.costEstimate.monthlyTotalLow * 0.05),
    monthlyCostHigh:
      node.data.monthlyCostHigh ??
      (monthlyCostHigh || architecture.costEstimate.monthlyTotalHigh * 0.15),
    capacity: node.data.scalabilityLabel
      ? {
          label: "Scalability",
          value: node.data.scalabilityLabel,
          detail: node.data.scalabilityDetail ?? "Sized for your workload",
        }
      : meta?.capacity ?? {
          label: "Workload fit",
          value: "Scales with demand",
          detail: "Sizing depends on your intake volume and retention policy",
        },
    recommendations,
    govcloudNotes: meta?.notes ?? ["Confirm FedRAMP authorization for this service in GovCloud"],
    relatedAlternatives,
  };
}
