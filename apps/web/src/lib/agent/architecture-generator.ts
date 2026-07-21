import {
  ArchitectureProposalSchema,
  autoLayoutServices,
  checkCompliance,
  enrichArchitectureAnalytics,
  estimateMonthlyCost,
  findGovCloudService,
  generateFullIac,
  type ArchitectureProposal,
  type ServiceNode,
} from "@cloudarch/shared";
import { invokeArchitectureModel } from "@/lib/bedrock/client";
import { formatRagContext, retrieveFromKnowledgeBase, type RagResult } from "@/lib/bedrock/knowledge-base";
import { buildMockArchitecture, buildServiceComparison } from "@/lib/agent/tools";

const ARCHITECTURE_JSON_PROMPT = `You are an AWS GovCloud solutions architect powered by OpenSearch RAG context. Output ONLY valid JSON (no markdown):

{
  "summary": "one paragraph architecture summary",
  "compliance": { "framework": "FedRAMP"|"ITAR"|"HIPAA"|"None", "level": "High"|"Moderate"|"Low" },
  "services": [
    {
      "id": "unique-id",
      "type": "awsService",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Short label",
        "service": "Full AWS service name",
        "category": "Networking"|"Compute"|"Storage"|"Database"|"Integration"|"Security"|"Management",
        "description": "role in this architecture",
        "govcloudAvailable": true,
        "aiRecommendation": "why this service was chosen",
        "scalabilityLabel": "e.g. 10k docs/day",
        "scalabilityDetail": "how this service scales for the workload",
        "scalabilityRating": "low"|"medium"|"high"
      }
    }
  ],
  "connections": [
    { "id": "e1", "source": "node-id", "target": "node-id", "label": "optional", "animated": true }
  ],
  "tradeoffs": [{ "title": "...", "pros": ["..."], "cons": ["..."], "recommendation": "..." }],
  "workload": { "documentsPerDay": 10000, "storageGb": 500 }
}

Rules:
- Use ONLY GovCloud-available services (us-gov-west-1)
- Include 6-10 services with clear data flow left-to-right / top-to-bottom
- connections must reference valid service ids`;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match?.[1]) {
      return JSON.parse(match[1].trim());
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("No JSON found in model response");
  }
}

function enrichServicesWithCatalog(services: ServiceNode[], ragResults: RagResult[]): ServiceNode[] {
  return services.map((node) => {
    const catalog = findGovCloudService(node.data.service);
    const ragMatch = ragResults.find((r) =>
      r.text.toLowerCase().includes(node.data.label.toLowerCase())
    );
    return {
      ...node,
      type: "awsService",
      data: {
        ...node.data,
        govcloudAvailable: catalog?.available ?? node.data.govcloudAvailable,
        docsUrl: catalog?.docsUrl ?? node.data.docsUrl,
        aiRecommendation:
          node.data.aiRecommendation ??
          ragMatch?.text.slice(0, 180) ??
          catalog?.description,
        ragSource: ragMatch?.source ?? catalog?.docsUrl,
      },
    };
  });
}

function buildProposalFromParsed(
  projectId: string,
  userMessage: string,
  parsed: Record<string, unknown>,
  ragResults: RagResult[],
  services: ServiceNode[]
): ArchitectureProposal {
  const workload = (parsed.workload as Record<string, number>) ?? {};
  const framework = (parsed.compliance as { framework?: string })?.framework ?? "FedRAMP";
  const complianceFlags = checkCompliance({
    services: services.map((s) => s.data.service),
    framework: framework as "FedRAMP" | "ITAR" | "HIPAA" | "None",
  });

  const costEstimate = estimateMonthlyCost({
    documentsPerDay: Number(workload.documentsPerDay ?? 10_000),
    storageGb: Number(workload.storageGb ?? 500),
  });

  const proposal: ArchitectureProposal = {
    projectId,
    summary: String(parsed.summary ?? `GovCloud architecture for: ${userMessage.slice(0, 200)}`),
    compliance: {
      framework: framework as ArchitectureProposal["compliance"]["framework"],
      level: String((parsed.compliance as { level?: string })?.level ?? "High"),
      flags: complianceFlags,
    },
    services,
    connections: (parsed.connections as ArchitectureProposal["connections"]) ?? [],
    tradeoffs: (parsed.tradeoffs as ArchitectureProposal["tradeoffs"]) ?? [],
    costEstimate,
    alternatives: [
      buildServiceComparison(["Lambda", "Fargate"], "compute for document processing"),
    ],
    ragInsights: ragResults.map((r) => r.text.slice(0, 160)),
  };

  proposal.generatedIac = generateFullIac(proposal);
  return enrichArchitectureAnalytics(proposal);
}

export async function generateArchitectureProposal(
  projectId: string,
  userMessage: string,
  agentAnalysis: string
): Promise<ArchitectureProposal> {
  const ragResults = await retrieveFromKnowledgeBase(
    `${userMessage} AWS GovCloud architecture services compliance scalability pricing`,
    6
  );
  const ragContext = formatRagContext(ragResults);

  try {
    const raw = await invokeArchitectureModel({
      system: ARCHITECTURE_JSON_PROMPT,
      userMessage: `User requirements:\n${userMessage}\n\nContext:\n${agentAnalysis}\n\nOpenSearch RAG results:\n${ragContext}\n\nGenerate architecture JSON for project ${projectId}.`,
      maxTokens: 8192,
    });

    const parsed = extractJson(raw) as Record<string, unknown>;
    const services = enrichServicesWithCatalog(
      autoLayoutServices((parsed.services as ServiceNode[]) ?? []),
      ragResults
    );

    return ArchitectureProposalSchema.parse(
      buildProposalFromParsed(projectId, userMessage, parsed, ragResults, services)
    );
  } catch (err) {
    console.warn("GPT OSS architecture generation failed, using enhanced mock:", err);
    const mock = buildMockArchitecture(projectId, userMessage);
    mock.ragInsights = ragResults.map((r) => r.text.slice(0, 160));
    mock.services = enrichServicesWithCatalog(autoLayoutServices(mock.services), ragResults);
    mock.generatedIac = generateFullIac(mock);
    return ArchitectureProposalSchema.parse(enrichArchitectureAnalytics(mock));
  }
}
