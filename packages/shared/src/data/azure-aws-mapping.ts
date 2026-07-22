import type { AzureService } from "./azure-services.js";

export interface AzureAwsMapping {
  azureService: string;
  awsService: string;
  awsGovCloudEquivalent: string;
  pattern: string;
  defaultReason: string;
  migrationConsiderations: string[];
}

export const AZURE_AWS_MAPPINGS: AzureAwsMapping[] = [
  {
    azureService: "Azure Blob Storage",
    awsService: "Amazon S3",
    awsGovCloudEquivalent: "Amazon S3 (AWS GovCloud)",
    pattern: "object_storage",
    defaultReason:
      "Both provide scalable object storage for unstructured data with encryption and lifecycle policies.",
    migrationConsiderations: [
      "Convert Azure containers into S3 buckets",
      "Configure bucket policies and block public access",
      "Enable SSE-KMS encryption",
      "Set lifecycle policies for archival tiers",
    ],
  },
  {
    azureService: "Azure Functions",
    awsService: "AWS Lambda",
    awsGovCloudEquivalent: "AWS Lambda (AWS GovCloud)",
    pattern: "serverless_compute",
    defaultReason:
      "Both provide event-driven serverless execution without managing servers.",
    migrationConsiderations: [
      "Rewrite function handlers for Lambda runtime",
      "Map Azure triggers to API Gateway, S3, or SQS events",
      "Configure IAM execution roles with least privilege",
      "Test cold start and timeout limits",
    ],
  },
  {
    azureService: "Azure SQL Database",
    awsService: "Amazon RDS",
    awsGovCloudEquivalent: "Amazon RDS (AWS GovCloud)",
    pattern: "relational_database",
    defaultReason:
      "Both offer managed relational databases with automated backups and patching.",
    migrationConsiderations: [
      "Use AWS DMS for schema and data migration",
      "Validate T-SQL compatibility with RDS engine choice",
      "Configure Multi-AZ for high availability",
      "Enable encryption at rest with KMS",
    ],
  },
  {
    azureService: "Azure Cosmos DB",
    awsService: "Amazon DynamoDB",
    awsGovCloudEquivalent: "Amazon DynamoDB (AWS GovCloud)",
    pattern: "nosql_database",
    defaultReason:
      "Both provide managed NoSQL with horizontal scaling and low-latency access.",
    migrationConsiderations: [
      "Redesign partition keys for DynamoDB access patterns",
      "Migrate data via export/import or custom ETL",
      "Enable point-in-time recovery",
    ],
  },
  {
    azureService: "Azure Kubernetes Service",
    awsService: "Amazon EKS",
    awsGovCloudEquivalent: "Amazon EKS (AWS GovCloud)",
    pattern: "container_orchestration",
    defaultReason:
      "Both run containerized workloads on managed Kubernetes control planes.",
    migrationConsiderations: [
      "Export Kubernetes manifests and Helm charts",
      "Rebuild container images in GovCloud ECR",
      "Configure IRSA for pod-level IAM",
    ],
  },
  {
    azureService: "Azure Active Directory",
    awsService: "IAM Identity Center",
    awsGovCloudEquivalent: "IAM Identity Center / Amazon Cognito",
    pattern: "identity_provider",
    defaultReason:
      "Centralized identity management for workforce and application users in GovCloud.",
    migrationConsiderations: [
      "Plan user and group migration from Azure AD",
      "Configure SAML/OIDC federation where needed",
      "Enable MFA for all privileged accounts",
      "Use Cognito for customer-facing app authentication",
    ],
  },
  {
    azureService: "Azure OpenAI",
    awsService: "Amazon Bedrock",
    awsGovCloudEquivalent: "Amazon Bedrock (AWS GovCloud)",
    pattern: "managed_ai",
    defaultReason:
      "Both provide managed foundation models for AI workloads without self-hosting GPUs.",
    migrationConsiderations: [
      "Map Azure OpenAI models to Bedrock model IDs",
      "Update API calls to Bedrock Runtime SDK",
      "Configure guardrails and logging for compliance",
    ],
  },
  {
    azureService: "Azure Cognitive Search",
    awsService: "Amazon OpenSearch Service",
    awsGovCloudEquivalent: "Amazon OpenSearch Service (AWS GovCloud)",
    pattern: "search_index",
    defaultReason:
      "Both index documents for full-text and semantic search at scale.",
    migrationConsiderations: [
      "Reindex documents into OpenSearch",
      "Configure fine-grained access control",
      "Enable encryption in transit and at rest",
    ],
  },
  {
    azureService: "Azure Monitor",
    awsService: "Amazon CloudWatch",
    awsGovCloudEquivalent: "Amazon CloudWatch (AWS GovCloud)",
    pattern: "observability",
    defaultReason:
      "Both collect metrics, logs, and alarms for operational visibility.",
    migrationConsiderations: [
      "Replace Application Insights with CloudWatch Logs and X-Ray",
      "Configure log retention for compliance audits",
      "Set up SNS alerts for critical thresholds",
    ],
  },
  {
    azureService: "Azure Key Vault",
    awsService: "AWS KMS",
    awsGovCloudEquivalent: "AWS KMS + Secrets Manager",
    pattern: "secrets_management",
    defaultReason:
      "KMS and Secrets Manager provide FIPS-validated key and secret management in GovCloud.",
    migrationConsiderations: [
      "Export secrets and rotate during cutover",
      "Create CMKs in KMS with strict key policies",
      "Store application secrets in Secrets Manager",
    ],
  },
];

export function mapAzureToAws(azureServiceName: string): AzureAwsMapping | undefined {
  const lower = azureServiceName.toLowerCase();
  return AZURE_AWS_MAPPINGS.find(
    (m) =>
      m.azureService.toLowerCase() === lower ||
      lower.includes(m.azureService.toLowerCase().replace("azure ", ""))
  );
}

export function mapAzureService(svc: AzureService): AzureAwsMapping {
  return (
    mapAzureToAws(svc.name) ?? {
      azureService: svc.name,
      awsService: "AWS GovCloud equivalent TBD",
      awsGovCloudEquivalent: "Consult AWS MAP documentation",
      pattern: svc.pattern,
      defaultReason: `Evaluate GovCloud equivalent for ${svc.name} based on workload pattern ${svc.pattern}.`,
      migrationConsiderations: ["Review AWS Migration Acceleration Program guidance"],
    }
  );
}
