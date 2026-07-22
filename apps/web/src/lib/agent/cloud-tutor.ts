import type {
  ArchitectureProposal,
  LearningExplanation,
  ServiceMapping,
} from "@cloudarch/shared";

const LEARNING_TEMPLATES: Record<
  string,
  { beginner: string; architect: string; interview: string }
> = {
  Lambda: {
    beginner:
      "Lambda is AWS's way of running code without managing servers. Think of it like: upload your code → AWS runs it whenever something happens.",
    architect:
      "Lambda provides event-driven serverless compute. It improves scalability because infrastructure provisioning is handled by AWS automatically.",
    interview:
      "Why choose Lambda over EC2? Lambda reduces operational overhead and automatically scales with demand — ideal when Azure Functions was already in use.",
  },
  S3: {
    beginner:
      "S3 stores files (objects) in buckets — like Azure Blob containers, but with GovCloud-specific encryption and access controls.",
    architect:
      "S3 provides 11-nines durability with SSE-KMS encryption, lifecycle policies, and event notifications for serverless pipelines.",
    interview:
      "S3 is the standard choice for object storage migrations from Azure Blob because of mature tooling and GovCloud FedRAMP authorization.",
  },
  OpenSearch: {
    beginner:
      "OpenSearch indexes your documents so employees can search by keyword or metadata — similar to Azure Cognitive Search.",
    architect:
      "OpenSearch Service offers full-text search, aggregations, and vector search for RAG workloads in GovCloud.",
    interview:
      "OpenSearch replaces Cognitive Search when you need full control over indexing pipelines and GovCloud data residency.",
  },
  Bedrock: {
    beginner:
      "Bedrock gives you AI models (like chat and search) without running your own GPU servers — the AWS equivalent of Azure OpenAI.",
    architect:
      "Bedrock provides managed foundation models with private VPC endpoints and audit logging for regulated AI workloads.",
    interview:
      "Bedrock is preferred over self-hosted models in GovCloud because it reduces ML ops burden while meeting compliance requirements.",
  },
  RDS: {
    beginner:
      "RDS is AWS's managed database — AWS handles backups, patching, and failover so you don't manage database servers.",
    architect:
      "RDS supports Multi-AZ deployments, automated backups, and encryption at rest for SQL workloads migrated from Azure SQL.",
    interview:
      "RDS is the direct Azure SQL Database equivalent; use DMS for minimal-downtime migration.",
  },
  Cognito: {
    beginner:
      "Cognito handles user sign-up, sign-in, and passwords for your app — replacing Azure AD for application users.",
    architect:
      "Cognito user pools integrate with API Gateway authorizers; IAM Identity Center handles workforce SSO separately.",
    interview:
      "Use Cognito for customer-facing auth and IAM Identity Center for employee SSO when migrating from Azure AD.",
  },
};

function templateFor(serviceLabel: string) {
  for (const [key, tpl] of Object.entries(LEARNING_TEMPLATES)) {
    if (serviceLabel.includes(key)) return tpl;
  }
  return {
    beginner: `${serviceLabel} is an AWS GovCloud service selected to replace a similar Azure capability.`,
    architect: `${serviceLabel} fits the target architecture pattern with GovCloud compliance controls.`,
    interview: `${serviceLabel} was chosen based on operational fit, compliance, and migration complexity.`,
  };
}

export function generateLearningContent(
  architecture: ArchitectureProposal,
  mappings: ServiceMapping[]
): LearningExplanation[] {
  return architecture.services.map((node) => {
    const mapping = mappings.find(
      (m) =>
        node.data.service.includes(m.awsService.replace("Amazon ", "").replace("AWS ", "")) ||
        node.data.label.toLowerCase().includes(m.awsService.toLowerCase().split(" ").pop() ?? "")
    );
    const tpl = templateFor(node.data.label);
    const azureSource = mapping?.azureService;

    return {
      serviceId: node.id,
      serviceName: node.data.label,
      azureSource,
      beginner: tpl.beginner,
      architect: mapping
        ? `${tpl.architect} It replaces ${azureSource} because: ${mapping.reason}`
        : tpl.architect,
      interview: mapping
        ? `${tpl.interview} Migration note: ${mapping.migrationConsiderations[0] ?? ""}`
        : tpl.interview,
    };
  });
}
