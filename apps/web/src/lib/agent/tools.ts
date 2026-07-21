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
import type { ToolConfiguration } from "@aws-sdk/client-bedrock-runtime";
import { retrieveFromKnowledgeBase } from "@/lib/bedrock/knowledge-base";

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
      name: "search_govcloud_knowledge",
      description:
        "Search OpenSearch-backed GovCloud knowledge base for architecture patterns, compliance guidance, and service best practices.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query e.g. document intake FedRAMP" },
          },
          required: ["query"],
        },
      },
    },
  },
] as NonNullable<ToolConfiguration["tools"]>;

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  projectId: string
): Promise<unknown> {
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
    case "search_govcloud_knowledge": {
      const query = String(input.query ?? "");
      return retrieveFromKnowledgeBase(query, 5);
    }
    case "search_learning_content": {
      const query = String(input.query ?? "");
      return retrieveFromKnowledgeBase(query, 3);
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export function buildServiceComparison(services: string[], useCase: string): ServiceComparison {
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
  const lower = description.toLowerCase();
  const isSearchWorkload =
    lower.includes("search") || lower.includes("classified") || lower.includes("employee");
  const costEstimate = estimateMonthlyCost({
    documentsPerDay: lower.includes("10k") ? 10000 : 5000,
    storageGb: 500,
  });

  const searchServices = [
    {
      id: "apigw",
      type: "awsService",
      position: { x: 400, y: 120 },
      data: {
        label: "API Gateway",
        service: "Amazon API Gateway",
        category: "Networking",
        description: "Secure upload and search API for employees",
        govcloudAvailable: true,
        aiRecommendation: "Front door for HTTPS document uploads and search queries with IAM auth.",
      },
    },
    {
      id: "lambda",
      type: "awsService",
      position: { x: 200, y: 280 },
      data: {
        label: "Lambda",
        service: "AWS Lambda",
        category: "Compute",
        description: "Process uploads and index documents for search",
        govcloudAvailable: true,
        aiRecommendation:
          "Serverless processing — runs automatically when a document arrives, no permanent servers.",
      },
    },
    {
      id: "s3",
      type: "awsService",
      position: { x: 600, y: 280 },
      data: {
        label: "S3",
        service: "Amazon S3",
        category: "Storage",
        description: "Encrypted storage for classified documents",
        govcloudAvailable: true,
        aiRecommendation: "Durable object storage with SSE-KMS for classified data at rest.",
      },
    },
    {
      id: "opensearch",
      type: "awsService",
      position: { x: 400, y: 420 },
      data: {
        label: "OpenSearch",
        service: "Amazon OpenSearch Service",
        category: "Database",
        description: "Full-text and metadata search index",
        govcloudAvailable: true,
        aiRecommendation: "Indexes document content so employees can search by keyword or metadata.",
      },
    },
    {
      id: "bedrock",
      type: "awsService",
      position: { x: 400, y: 560 },
      data: {
        label: "Bedrock",
        service: "Amazon Bedrock",
        category: "Compute",
        description: "Semantic search and natural-language Q&A",
        govcloudAvailable: true,
        aiRecommendation: "Managed AI for semantic search and summarization over classified docs.",
      },
    },
    {
      id: "kms",
      type: "awsService",
      position: { x: 200, y: 560 },
      data: {
        label: "KMS",
        service: "AWS KMS",
        category: "Security",
        description: "FIPS 140-2 encryption keys",
        govcloudAvailable: true,
        aiRecommendation: "Required for encrypting classified documents at rest and in transit.",
      },
    },
    {
      id: "cloudwatch",
      type: "awsService",
      position: { x: 600, y: 560 },
      data: {
        label: "CloudWatch",
        service: "Amazon CloudWatch",
        category: "Management",
        description: "Audit logs for access and search activity",
        govcloudAvailable: true,
        aiRecommendation: "FedRAMP audit trail for who accessed or searched which documents.",
      },
    },
  ];

  const intakeServices = [
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

  const services = isSearchWorkload ? searchServices : intakeServices;

  const searchConnections = [
    { id: "e1", source: "apigw", target: "lambda", label: "User uploads" },
    { id: "e2", source: "lambda", target: "s3", label: "store" },
    { id: "e3", source: "lambda", target: "opensearch", label: "index" },
    { id: "e4", source: "opensearch", target: "bedrock", label: "semantic search" },
    { id: "e5", source: "s3", target: "kms" },
    { id: "e6", source: "lambda", target: "cloudwatch", label: "audit logs" },
  ];

  const intakeConnections = [
    { id: "e1", source: "route53", target: "cloudfront", animated: true },
    { id: "e2", source: "cloudfront", target: "apigw", animated: true },
    { id: "e3", source: "apigw", target: "lambda", label: "POST /documents" },
    { id: "e4", source: "lambda", target: "s3", label: "store" },
    { id: "e5", source: "lambda", target: "sqs", label: "enqueue" },
    { id: "e6", source: "lambda", target: "dynamodb", label: "metadata" },
    { id: "e7", source: "s3", target: "kms" },
    { id: "e8", source: "lambda", target: "cloudwatch", label: "logs" },
  ];

  const connections = isSearchWorkload ? searchConnections : intakeConnections;

  const complianceFlags = checkCompliance({
    services: services.map((s) => s.data.service),
    framework: lower.includes("itar") ? "ITAR" : "FedRAMP",
  });

  const summary = isSearchWorkload
    ? `GovCloud architecture for storing classified documents and enabling employee search. Flow: User Uploads → S3 → Lambda → OpenSearch → Bedrock. Based on: ${description.slice(0, 200)}`
    : `FedRAMP-aligned document intake system for GovCloud handling high-volume uploads with encryption, async processing, and audit logging. Based on: ${description.slice(0, 200)}`;

  const proposal: ArchitectureProposal = {
    projectId,
    summary,
    compliance: {
      framework: lower.includes("itar") ? "ITAR" : "FedRAMP",
      level: "High",
      flags: complianceFlags,
    },
    services,
    connections,
    tradeoffs: [
      {
        title: isSearchWorkload ? "OpenSearch vs Kendra for search" : "Lambda vs Fargate for processing",
        pros: isSearchWorkload
          ? ["OpenSearch: full control, lower cost at scale", "Kendra: managed ML search, less ops"]
          : ["Lambda: zero ops, scales to zero", "Fargate: longer timeouts, custom runtimes"],
        cons: isSearchWorkload
          ? ["OpenSearch: cluster management", "Kendra: higher per-query cost"]
          : ["Lambda: 15 min max timeout", "Fargate: always-on cost baseline"],
        recommendation: isSearchWorkload
          ? "OpenSearch + Bedrock gives flexible keyword and semantic search for classified docs in GovCloud."
          : "Start with Lambda + SQS for document validation; move heavy OCR to Fargate if needed.",
      },
    ],
    costEstimate,
    alternatives: isSearchWorkload
      ? [
          buildServiceComparison(["OpenSearch", "Kendra"], "document search"),
          buildServiceComparison(["Bedrock", "SageMaker"], "AI inference"),
        ]
      : [buildServiceComparison(["Lambda", "Fargate"], "document processing")],
  };

  proposal.generatedIac = generateFullIac(proposal);
  return ArchitectureProposalSchema.parse(proposal);
}
