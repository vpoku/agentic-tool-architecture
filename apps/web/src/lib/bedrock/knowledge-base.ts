import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { GOVCLOUD_SERVICES, findGovCloudService } from "@cloudarch/shared";

export interface RagResult {
  text: string;
  source: string;
  score?: number;
}

const LOCAL_CORPUS: RagResult[] = [
  {
    source: "GovCloud Architecture Patterns",
    text: "Document intake on GovCloud: Route 53 → CloudFront → API Gateway → Lambda → S3 + SQS + DynamoDB. Use KMS for encryption and CloudWatch for FedRAMP audit logs.",
  },
  {
    source: "FedRAMP High Controls",
    text: "FedRAMP High requires encryption at rest (KMS CMK), TLS 1.2+ in transit, CloudTrail logging, and least-privilege IAM. All data must stay in us-gov-west-1 or us-gov-east-1.",
  },
  {
    source: "Lambda vs Fargate",
    text: "Use Lambda for event-driven document validation under 15 minutes. Use Fargate for OCR, ML inference, or long-running batch jobs. SQS decouples intake spikes.",
  },
  {
    source: "OpenSearch in GovCloud",
    text: "Amazon OpenSearch Service is available in GovCloud for log analytics and search. Bedrock Knowledge Bases can use OpenSearch Serverless as a vector store for RAG over architecture docs.",
  },
  {
    source: "S3 Best Practices",
    text: "Enable SSE-KMS, block public access, versioning, and lifecycle policies. S3 Event Notifications can trigger Lambda for document processing pipelines.",
  },
  {
    source: "High Volume Intake",
    text: "For 10k+ documents/day: use SQS to buffer uploads, Lambda concurrency limits with reserved concurrency, DynamoDB on-demand for metadata, and S3 multipart uploads.",
  },
  {
    source: "Azure Blob to S3 Migration",
    text: "Azure Blob Storage maps to Amazon S3 in GovCloud. Convert containers to buckets, enable SSE-KMS, block public access, and use AWS DataSync or azcopy for bulk transfer.",
  },
  {
    source: "Azure Functions to Lambda",
    text: "Azure Functions maps to AWS Lambda. Rewrite triggers for API Gateway, S3 events, or SQS. Configure IAM execution roles with least privilege.",
  },
  {
    source: "Azure AD to IAM Identity Center",
    text: "Azure Active Directory maps to IAM Identity Center for workforce SSO and Amazon Cognito for application users. Enable MFA and SAML federation.",
  },
  {
    source: "Azure Cognitive Search to OpenSearch",
    text: "Azure Cognitive Search maps to Amazon OpenSearch Service in GovCloud. Reindex documents and configure fine-grained access control.",
  },
  {
    source: "Azure SQL to RDS",
    text: "Azure SQL Database maps to Amazon RDS. Use AWS DMS for schema migration with Multi-AZ for high availability.",
  },
  {
    source: "Azure OpenAI to Bedrock",
    text: "Azure OpenAI maps to Amazon Bedrock in GovCloud for managed foundation models with audit logging and VPC endpoints.",
  },
  {
    source: "Azure Key Vault to KMS",
    text: "Azure Key Vault maps to AWS KMS and Secrets Manager. Rotate secrets during cutover and use CMKs with strict key policies.",
  },
  {
    source: "Azure Monitor to CloudWatch",
    text: "Azure Monitor and Application Insights map to CloudWatch Logs, Metrics, and X-Ray. Configure retention for FedRAMP audits.",
  },
  {
    source: "AWS MAP Migration",
    text: "AWS Migration Acceleration Program (MAP) provides methodology for Azure-to-AWS migrations: assess, mobilize, migrate, and optimize phases.",
  },
  {
    source: "Healthcare HIPAA on GovCloud",
    text: "Healthcare workloads require HIPAA-eligible services in GovCloud: encrypted S3, RDS with encryption, Cognito with MFA, and CloudTrail audit logging.",
  },
];

function getAgentClient(): BedrockAgentRuntimeClient {
  const region = process.env.AWS_REGION ?? "us-gov-west-1";
  return new BedrockAgentRuntimeClient({
    region,
    ...(process.env.AWS_USE_FIPS_ENDPOINT === "true" ? { useFipsEndpoint: true } : {}),
  });
}

export function isKnowledgeBaseConfigured(): boolean {
  return Boolean(process.env.BEDROCK_KNOWLEDGE_BASE_ID && process.env.AWS_ACCESS_KEY_ID);
}

/** Retrieve context from Bedrock Knowledge Base (OpenSearch Serverless vector store). */
export async function retrieveFromKnowledgeBase(
  query: string,
  maxResults = 5
): Promise<RagResult[]> {
  const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID;
  if (!knowledgeBaseId || !process.env.AWS_ACCESS_KEY_ID) {
    return searchLocalCorpus(query, maxResults);
  }

  try {
    const client = getAgentClient();
    const response = await client.send(
      new RetrieveCommand({
        knowledgeBaseId,
        retrievalQuery: { text: query },
        retrievalConfiguration: {
          vectorSearchConfiguration: { numberOfResults: maxResults },
        },
      })
    );

    const results: RagResult[] =
      response.retrievalResults?.map((r) => ({
        text: r.content?.text ?? "",
        source: r.location?.s3Location?.uri ?? r.location?.type ?? "Knowledge Base",
        score: r.score,
      })) ?? [];

    if (results.length === 0) {
      return searchLocalCorpus(query, maxResults);
    }
    return results;
  } catch (err) {
    console.warn("Knowledge Base retrieval failed, using local corpus:", err);
    return searchLocalCorpus(query, maxResults);
  }
}

function searchLocalCorpus(query: string, maxResults: number): RagResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = LOCAL_CORPUS.map((doc) => {
    const haystack = `${doc.text} ${doc.source}`.toLowerCase();
    const score = terms.reduce((acc, term) => (haystack.includes(term) ? acc + 1 : acc), 0);
    return { ...doc, score };
  })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored.slice(0, maxResults);
  }

  const serviceHits = terms.flatMap((term) => {
    const svc = findGovCloudService(term);
    return svc
      ? [{ text: `${svc.name}: ${svc.description}. ${svc.fipsNotes ?? ""}`, source: svc.docsUrl, score: 1 }]
      : [];
  });

  if (serviceHits.length > 0) {
    return serviceHits.slice(0, maxResults);
  }

  return LOCAL_CORPUS.slice(0, maxResults);
}

export function formatRagContext(results: RagResult[]): string {
  if (results.length === 0) return "";
  return results
    .map((r, i) => `[${i + 1}] (${r.source}): ${r.text}`)
    .join("\n\n");
}

export function extractRagInsights(results: RagResult[]): string[] {
  return results.map((r) => r.text.slice(0, 200));
}
