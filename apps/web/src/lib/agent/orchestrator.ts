import {
  invokeArchitectureModel,
  isMockMode,
  isOpenAiOssModel,
  getModelId,
} from "@/lib/bedrock/client";
import { retrieveFromKnowledgeBase, formatRagContext, extractRagInsights } from "@/lib/bedrock/knowledge-base";
import { generateArchitectureProposal } from "@/lib/agent/architecture-generator";
import { buildMockArchitecture } from "@/lib/agent/tools";
import {
  enrichArchitectureAnalytics,
  generateFullIac,
  type ArchitectureProposal,
} from "@cloudarch/shared";
import {
  getProject,
  saveArchitecture,
  addChatMessage,
  updateProject,
} from "@/lib/store";

export interface AgentResult {
  reply: string;
  architecture?: ArchitectureProposal;
}

async function buildArchitecture(
  projectId: string,
  userMessage: string,
  agentAnalysis: string
): Promise<ArchitectureProposal> {
  if (isMockMode()) {
    const ragResults = await retrieveFromKnowledgeBase(userMessage, 5);
    const architecture = buildMockArchitecture(projectId, userMessage);
    architecture.ragInsights = extractRagInsights(ragResults);
    architecture.services = architecture.services.map((s) => {
      const rag = ragResults.find((r) =>
        r.text.toLowerCase().includes(s.data.label.toLowerCase())
      );
      return {
        ...s,
        type: "awsService",
        data: {
          ...s.data,
          aiRecommendation: rag?.text.slice(0, 180) ?? s.data.description,
          ragSource: rag?.source,
        },
      };
    });
    architecture.generatedIac = generateFullIac(architecture);
    return enrichArchitectureAnalytics(architecture);
  }
  return generateArchitectureProposal(projectId, userMessage, agentAnalysis);
}

function buildReply(projectName: string, architecture: ArchitectureProposal): string {
  const pipeline = architecture.services.map((s) => s.data.label).join(" → ");
  const scores = architecture.scores;
  const scoreLine = scores
    ? `**Report card:** Security ${"★".repeat(scores.security)}${"☆".repeat(5 - scores.security)} · Scalability ${"★".repeat(scores.scalability)}${"☆".repeat(5 - scores.scalability)} · Cost ${"★".repeat(scores.cost)}${"☆".repeat(5 - scores.cost)}`
    : "";

  const rationaleBlock = (architecture.serviceRationales ?? [])
    .slice(0, 4)
    .map((r) => `- **${r.serviceName}:** ${r.plainEnglish}`)
    .join("\n");

  const altBlock =
    architecture.alternatives.length > 0
      ? `\n**Alternatives:** ${architecture.alternatives.map((a) => a.verdict).join(" ")}`
      : "";

  return `I've designed a GovCloud architecture for "${projectName}".

**Summary:** ${architecture.summary}

**Recommended services:** ${architecture.services.map((s) => s.data.label).join(", ")}

**Data flow:** ${pipeline}

**Estimated cost:** $${architecture.costEstimate.monthlyTotalLow.toFixed(0)}–$${architecture.costEstimate.monthlyTotalHigh.toFixed(0)}/month

${scoreLine}

**Why these services:**
${rationaleBlock || architecture.services.map((s) => `- **${s.data.label}:** ${s.data.description ?? s.data.aiRecommendation ?? ""}`).join("\n")}
${altBlock}

Hover any node in the pipeline for pricing and scalability. Open the **Review** tab for costs, data flow, and service rationale.`;
}

export async function runAgent(
  projectId: string,
  userMessage: string
): Promise<AgentResult> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");

  await addChatMessage({ projectId, role: "user", content: userMessage });
  await updateProject(projectId, { status: "analyzing" });

  const ragResults = await retrieveFromKnowledgeBase(userMessage, 6);
  const ragContext = formatRagContext(ragResults);

  let agentAnalysis = ragContext;
  if (!isMockMode() && isOpenAiOssModel(getModelId())) {
    try {
      agentAnalysis = await invokeArchitectureModel({
        system:
          "You are a GovCloud architect. Summarize the user's requirements and how OpenSearch RAG context informs the architecture. Be concise.",
        userMessage: `Requirements:\n${userMessage}\n\nRAG:\n${ragContext}`,
        maxTokens: 1024,
      });
    } catch {
      agentAnalysis = ragContext;
    }
  }

  const architecture = await buildArchitecture(projectId, userMessage, agentAnalysis);
  await saveArchitecture(projectId, architecture);

  const reply = buildReply(project.name, architecture);
  await addChatMessage({ projectId, role: "assistant", content: reply });

  return { reply, architecture };
}

export async function refineArchitecture(
  projectId: string,
  userMessage: string
): Promise<AgentResult> {
  return runAgent(projectId, userMessage);
}
