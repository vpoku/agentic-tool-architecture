import {
  ArchitectureProposalSchema,
  autoLayoutServices,
  checkCompliance,
  enrichArchitectureAnalytics,
  estimateMonthlyCost,
  findGovCloudService,
  type ArchitectureProposal,
  type AzureArchitecture,
  type ServiceMapping,
} from "@cloudarch/shared";

function slug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function awsLabel(awsService: string): string {
  return awsService
    .replace("Amazon ", "")
    .replace("AWS ", "")
    .split(" ")[0];
}

export function generateMigrationArchitecture(
  projectId: string,
  azure: AzureArchitecture,
  mappings: ServiceMapping[]
): ArchitectureProposal {
  const uniqueMappings = dedupeMappings(mappings);
  const hasIdentity = uniqueMappings.some((m) =>
    m.azureService.toLowerCase().includes("active directory")
  );
  const hasSearch = uniqueMappings.some((m) =>
    m.azureService.toLowerCase().includes("search")
  );
  const hasAi = uniqueMappings.some(
    (m) =>
      m.azureService.toLowerCase().includes("openai") ||
      m.awsService.toLowerCase().includes("bedrock")
  );

  const nodes: ArchitectureProposal["services"] = [];
  const addNode = (
    id: string,
    label: string,
    service: string,
    category: string,
    description: string,
    azureSource: string
  ) => {
    const catalog = findGovCloudService(service);
    nodes.push({
      id,
      type: "awsService",
      position: { x: 0, y: 0 },
      data: {
        label,
        service: catalog?.name ?? service,
        category,
        description,
        govcloudAvailable: catalog?.available ?? true,
        docsUrl: catalog?.docsUrl,
        aiRecommendation: `Selected because ${azureSource} was used in Azure. ${description}`,
      },
    });
  };

  if (hasIdentity) {
    addNode(
      "cognito",
      "Cognito",
      "Amazon Cognito",
      "Security",
      "User authentication replacing Azure AD",
      "Azure Active Directory"
    );
  }

  addNode(
    "apigw",
    "API Gateway",
    "Amazon API Gateway",
    "Networking",
    "HTTPS API front door",
    "Azure API Management or Functions HTTP triggers"
  );

  for (const m of uniqueMappings) {
    if (m.azureService.toLowerCase().includes("active directory")) continue;
    const label = awsLabel(m.awsGovCloudEquivalent);
    const id = slug(label);
    if (nodes.some((n) => n.id === id)) continue;
    const category = inferCategory(m.awsService);
    addNode(id, label, m.awsService, category, m.reason, m.azureService);
  }

  if (hasSearch && !nodes.some((n) => n.id === "opensearch")) {
    addNode(
      "opensearch",
      "OpenSearch",
      "Amazon OpenSearch Service",
      "Database",
      "Document search index",
      "Azure Cognitive Search"
    );
  }

  if (hasAi && !nodes.some((n) => n.id === "bedrock")) {
    addNode(
      "bedrock",
      "Bedrock",
      "Amazon Bedrock",
      "Compute",
      "Semantic search and AI Q&A",
      "Azure OpenAI"
    );
  }

  if (!nodes.some((n) => n.id === "kms")) {
    addNode("kms", "KMS", "AWS KMS", "Security", "FIPS 140-2 encryption keys", "Azure Key Vault");
  }

  if (!nodes.some((n) => n.id === "cloudwatch")) {
    addNode(
      "cloudwatch",
      "CloudWatch",
      "Amazon CloudWatch",
      "Management",
      "Audit logs and monitoring",
      "Azure Monitor"
    );
  }

  const layout = autoLayoutServices(nodes);
  const connections = buildConnections(layout, hasIdentity, hasSearch, hasAi);

  const framework =
    azure.complianceRequirements.includes("HIPAA")
      ? "HIPAA"
      : azure.complianceRequirements.includes("ITAR")
        ? "ITAR"
        : "FedRAMP";

  const costEstimate = estimateMonthlyCost({
    documentsPerDay: azure.expectedUsers ? Math.min(azure.expectedUsers * 10, 10000) : 5000,
    storageGb: 500,
  });

  const proposal: ArchitectureProposal = {
    projectId,
    summary: `AWS GovCloud target architecture for ${azure.applicationName}, migrated from Azure. Each service maps to an Azure equivalent with GovCloud compliance controls.`,
    compliance: {
      framework: framework as ArchitectureProposal["compliance"]["framework"],
      level: "High",
      flags: checkCompliance({
        services: layout.map((s) => s.data.service),
        framework: framework as "FedRAMP" | "ITAR" | "HIPAA" | "None",
      }),
    },
    services: layout,
    connections,
    tradeoffs: [
      {
        title: "Lift-and-shift vs re-architect",
        pros: ["Faster initial migration", "Lower short-term risk"],
        cons: ["May miss cloud-native optimizations", "Technical debt carries over"],
        recommendation:
          "Start with like-for-like mappings (Functions→Lambda, Blob→S3), then optimize in Phase 2.",
      },
    ],
    costEstimate,
    alternatives: [],
  };

  return ArchitectureProposalSchema.parse(enrichArchitectureAnalytics(proposal));
}

function dedupeMappings(mappings: ServiceMapping[]): ServiceMapping[] {
  const seen = new Set<string>();
  return mappings.filter((m) => {
    if (seen.has(m.awsService)) return false;
    seen.add(m.awsService);
    return true;
  });
}

function inferCategory(awsService: string): string {
  const lower = awsService.toLowerCase();
  if (lower.includes("s3")) return "Storage";
  if (lower.includes("lambda") || lower.includes("bedrock") || lower.includes("eks"))
    return "Compute";
  if (lower.includes("rds") || lower.includes("dynamodb") || lower.includes("opensearch"))
    return "Database";
  if (lower.includes("cognito") || lower.includes("kms")) return "Security";
  if (lower.includes("cloudwatch")) return "Management";
  return "Integration";
}

function buildConnections(
  services: ArchitectureProposal["services"],
  hasIdentity: boolean,
  hasSearch: boolean,
  hasAi: boolean
): ArchitectureProposal["connections"] {
  const ids = new Set(services.map((s) => s.id));
  const edges: ArchitectureProposal["connections"] = [];
  const add = (source: string, target: string, label?: string) => {
    if (ids.has(source) && ids.has(target)) {
      edges.push({ id: `e-${source}-${target}`, source, target, label, animated: true });
    }
  };

  if (hasIdentity) add("cognito", "apigw");
  else add("apigw", "lambda", "requests");

  const lambda = services.find((s) => s.id === "lambda");
  const s3 = services.find((s) => s.id === "s3");
  const rds = services.find((s) => s.id === "rds" || s.id === "amazon-rds");
  const opensearch = services.find((s) => s.id === "opensearch");
  const bedrock = services.find((s) => s.id === "bedrock");

  if (hasIdentity) add("apigw", lambda?.id ?? "lambda", "API calls");
  if (lambda && s3) add(lambda.id, s3.id, "store");
  if (lambda && rds) add(lambda.id, rds.id, "metadata");
  if (lambda && opensearch) add(lambda.id, opensearch.id, "index");
  if (opensearch && bedrock && hasAi) add(opensearch.id, bedrock.id, "semantic search");
  if (s3) add(s3.id, "kms");
  if (lambda) add(lambda.id, "cloudwatch", "logs");

  if (edges.length === 0 && services.length >= 2) {
    for (let i = 0; i < services.length - 1; i++) {
      add(services[i].id, services[i + 1].id);
    }
  }

  return edges;
}
