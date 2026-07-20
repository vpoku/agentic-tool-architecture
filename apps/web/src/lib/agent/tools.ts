import {
  findGovCloudService,
  GOVCLOUD_SERVICES,
  estimateMonthlyCost,
  checkCompliance,
  generateFullIac,
  type ArchitectureProposal,
  type ServiceComparison,
  ArchitectureProposalSchema,
} from "@cloudarch/shared";

export const TOOL_DEFINITIONS = [
  {
    toolSpec: {
      name: "lookup_govcloud_service",
      description: "Check if an AWS service is available in GovCloud and get documentation links.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            serviceName: { type: "string", description: "AWS service name e.g. Lambda, S3" },
          },
          required: ["serviceName"],
        },
      },
    },
  },
  {
    toolSpec: {
      name: "compare_services",
      description: "Compare two or more AWS services for a specific use case in GovCloud.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            services: { type: "array", items: { type: "string" } },
            useCase: { type: "string" },
          },
          required: ["services", "useCase"],
        },
      },
    },
  },
  {
    toolSpec: {
      name: "estimate_monthly_cost",
      description: "Estimate monthly AWS GovCloud costs based on workload parameters.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            documentsPerDay: { type: "number" },
            storageGb: { type: "number" },
            requestsPerDay: { type: "number" },
          },
        },
      },
    },
  },
  {
    toolSpec: {
      name: "check_compliance",
      description: "Check architecture against FedRAMP/ITAR compliance rules.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            services: { type: "array", items: { type: "string" } },
            framework: { type: "string", enum: ["FedRAMP", "ITAR", "HIPAA", "None"] },
          },
          required: ["services", "framework"],
        },
      },
    },
  },
  {
    toolSpec: {
      name: "search_learning_content",
      description: "Search GovCloud learning materials by topic or service name.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            query: { type: "string" },
          },
          required: ["query"],
        },
      },
    },
  },
];

export function executeTool(
  name: string,
  input: Record<string, unknown>,
  projectId: string
): unknown {
  switch (name) {
    case "lookup_govcloud_service": {
      const serviceName = String(input.serviceName ?? "");
      const found = findGovCloudService(serviceName);
      if (found) return found;
      return {
        available: false,
        message: `${serviceName} not found in GovCloud catalog. Available: ${GOVCLOUD_SERVICES.filter((s) => s.available).map((s) => s.name).join(", ")}`,
      };
    }
    case "compare_services": {
      const services = (input.services as string[]) ?? [];
      const useCase = String(input.useCase ?? "");
      return buildServiceComparison(services, useCase);
    }
    case "estimate_monthly_cost":
      return estimateMonthlyCost({
        documentsPerDay: Number(input.documentsPerDay ?? 10000),
        storageGb: Number(input.storageGb ?? 500),
        requestsPerDay: Number(input.requestsPerDay ?? 30000),
      });
    case "check_compliance":
      return checkCompliance({
        services: (input.services as string[]) ?? [],
        framework: (input.framework as "FedRAMP" | "ITAR" | "HIPAA" | "None") ?? "FedRAMP",
      });
    case "search_learning_content": {
      const query = String(input.query ?? "").toLowerCase();
      return LEARNING_SNIPPETS.filter(
        (s) => s.title.toLowerCase().includes(query) || s.tags.some((t) => t.includes(query))
      ).slice(0, 3);
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

const LEARNING_SNIPPETS = [
  {
    title: "GovCloud Regions",
    tags: ["govcloud", "regions", "fedramp"],
    excerpt: "AWS GovCloud operates in us-gov-west-1 and us-gov-east-1. Data never leaves the US sovereign boundary.",
  },
  {
    title: "Amazon S3 in GovCloud",
    tags: ["s3", "storage", "encryption"],
    excerpt: "Use SSE-KMS with customer-managed keys. Enable bucket versioning and block all public access.",
  },
  {
    title: "AWS Lambda Patterns",
    tags: ["lambda", "serverless", "compute"],
    excerpt: "Lambda is ideal for event-driven document processing. Pair with SQS for burst workloads.",
  },
  {
    title: "FedRAMP Compliance Basics",
    tags: ["fedramp", "compliance", "security"],
    excerpt: "FedRAMP High requires encryption at rest, audit logging, and boundary monitoring.",
  },
];

function buildServiceComparison(services: string[], useCase: string): ServiceComparison {
  const details = services.map((name) => {
    const svc = findGovCloudService(name);
    return {
      name: svc?.name ?? name,
      pros: svc?.available
        ? [`Available in GovCloud`, svc.description]
        : [`May not be available in GovCloud`],
      cons: svc?.available ? [] : ["Consider GovCloud-approved alternatives"],
      bestFor: useCase,
      govcloudNotes: svc?.fipsNotes,
    };
  });

  return {
    id: crypto.randomUUID(),
    title: `${services.join(" vs ")} for ${useCase}`,
    services: details,
    verdict: `For ${useCase} in GovCloud, evaluate operational complexity vs cost. Serverless (Lambda) suits variable workloads; Fargate suits long-running containers.`,
  };
}

export function buildMockArchitecture(
  projectId: string,
  description: string
): ArchitectureProposal {
  const costEstimate = estimateMonthlyCost({
    documentsPerDay: description.toLowerCase().includes("10k") ? 10000 : 5000,
    storageGb: 500,
  });

  const services = [
    {
      id: "route53",
      type: "awsService",
      position: { x: 400, y: 0 },
      data: {
        label: "Route 53",
        service: "Amazon Route 53",
        category: "Networking",
        description: "DNS routing for intake API",
        govcloudAvailable: true,
      },
    },
    {
      id: "cloudfront",
      type: "awsService",
      position: { x: 400, y: 120 },
      data: {
        label: "CloudFront",
        service: "Amazon CloudFront",
        category: "Networking",
        description: "CDN and TLS termination",
        govcloudAvailable: true,
      },
    },
    {
      id: "apigw",
      type: "awsService",
      position: { x: 400, y: 240 },
      data: {
        label: "API Gateway",
        service: "Amazon API Gateway",
        category: "Networking",
        description: "Document intake REST API",
        govcloudAvailable: true,
      },
    },
    {
      id: "lambda",
      type: "awsService",
      position: { x: 200, y: 360 },
      data: {
        label: "Lambda",
        service: "AWS Lambda",
        category: "Compute",
        description: "Validate and route incoming documents",
        govcloudAvailable: true,
      },
    },
    {
      id: "s3",
      type: "awsService",
      position: { x: 600, y: 360 },
      data: {
        label: "S3",
        service: "Amazon S3",
        category: "Storage",
        description: "Encrypted document storage",
        govcloudAvailable: true,
      },
    },
    {
      id: "sqs",
      type: "awsService",
      position: { x: 200, y: 480 },
      data: {
        label: "SQS",
        service: "Amazon SQS",
        category: "Integration",
        description: "Async processing queue",
        govcloudAvailable: true,
      },
    },
    {
      id: "dynamodb",
      type: "awsService",
      position: { x: 600, y: 480 },
      data: {
        label: "DynamoDB",
        service: "Amazon DynamoDB",
        category: "Database",
        description: "Document metadata index",
        govcloudAvailable: true,
      },
    },
    {
      id: "kms",
      type: "awsService",
      position: { x: 400, y: 600 },
      data: {
        label: "KMS",
        service: "AWS KMS",
        category: "Security",
        description: "FIPS 140-2 encryption keys",
        govcloudAvailable: true,
      },
    },
    {
      id: "cloudwatch",
      type: "awsService",
      position: { x: 400, y: 720 },
      data: {
        label: "CloudWatch",
        service: "Amazon CloudWatch",
        category: "Management",
        description: "Audit logs and alarms",
        govcloudAvailable: true,
      },
    },
  ];

  const connections = [
    { id: "e1", source: "route53", target: "cloudfront", animated: true },
    { id: "e2", source: "cloudfront", target: "apigw", animated: true },
    { id: "e3", source: "apigw", target: "lambda", label: "POST /documents" },
    { id: "e4", source: "lambda", target: "s3", label: "store" },
    { id: "e5", source: "lambda", target: "sqs", label: "enqueue" },
    { id: "e6", source: "lambda", target: "dynamodb", label: "metadata" },
    { id: "e7", source: "s3", target: "kms" },
    { id: "e8", source: "lambda", target: "cloudwatch", label: "logs" },
  ];

  const complianceFlags = checkCompliance({
    services: services.map((s) => s.data.service),
    framework: description.toLowerCase().includes("itar") ? "ITAR" : "FedRAMP",
  });

  const proposal: ArchitectureProposal = {
    projectId,
    summary: `FedRAMP-aligned document intake system for GovCloud handling high-volume uploads with encryption, async processing, and audit logging. Based on: ${description.slice(0, 200)}`,
    compliance: {
      framework: description.toLowerCase().includes("itar") ? "ITAR" : "FedRAMP",
      level: "High",
      flags: complianceFlags,
    },
    services,
    connections,
    tradeoffs: [
      {
        title: "Lambda vs Fargate for processing",
        pros: ["Lambda: zero ops, scales to zero", "Fargate: longer timeouts, custom runtimes"],
        cons: ["Lambda: 15 min max timeout", "Fargate: always-on cost baseline"],
        recommendation: "Start with Lambda + SQS for document validation; move heavy OCR to Fargate if needed.",
      },
    ],
    costEstimate,
    alternatives: [
      buildServiceComparison(["Lambda", "Fargate"], "document processing"),
    ],
  };

  proposal.generatedIac = generateFullIac(proposal);
  return ArchitectureProposalSchema.parse(proposal);
}
