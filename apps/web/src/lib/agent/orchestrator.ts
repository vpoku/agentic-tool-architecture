import type { Message, ContentBlock } from "@aws-sdk/client-bedrock-runtime";
import {
  converse,
  textFromContent,
  toolUsesFromContent,
  isMockMode,
} from "@/lib/bedrock/client";
import { retrieveFromKnowledgeBase, formatRagContext, extractRagInsights } from "@/lib/bedrock/knowledge-base";
import { generateArchitectureProposal } from "@/lib/agent/architecture-generator";
import { TOOL_DEFINITIONS, executeTool, buildMockArchitecture } from "@/lib/agent/tools";
import { generateFullIac, type ArchitectureProposal } from "@cloudarch/shared";
import {
  getProject,
  saveArchitecture,
  addChatMessage,
  getChatMessages,
  updateProject,
} from "@/lib/store";

const SYSTEM_PROMPT = `You are CloudArch Architect, an expert AWS GovCloud solutions architect.

Rules:
- Recommend ONLY services available in AWS GovCloud (us-gov-west-1, us-gov-east-1)
- Use search_govcloud_knowledge to retrieve OpenSearch-backed architecture patterns before recommending
- Use tools to lookup services, compare options, estimate costs, and check compliance
- Explain tradeoffs in plain English for non-technical users
- Flag FedRAMP, ITAR, and HIPAA compliance considerations
- Never recommend commercial-only AWS services

After using tools, summarize the proposed architecture and why each service was chosen.`;

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
        data: {
          ...s.data,
          aiRecommendation: rag?.text.slice(0, 180) ?? s.data.description,
          ragSource: rag?.source,
        },
      };
    });
    architecture.generatedIac = generateFullIac(architecture);
    return architecture;
  }
  return generateArchitectureProposal(projectId, userMessage, agentAnalysis);
}

export async function runAgent(
  projectId: string,
  userMessage: string
): Promise<AgentResult> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");

  await addChatMessage({ projectId, role: "user", content: userMessage });
  await updateProject(projectId, { status: "analyzing" });

  const ragResults = await retrieveFromKnowledgeBase(userMessage, 4);
  const ragContext = formatRagContext(ragResults);

  if (isMockMode()) {
    const architecture = await buildArchitecture(projectId, userMessage, ragContext);
    await saveArchitecture(projectId, architecture);
    const reply = `I've designed a GovCloud architecture for "${project.name}" using retrieved knowledge base patterns.

**Summary:** ${architecture.summary}

**Services:** ${architecture.services.map((s) => s.data.label).join(" → ")}

**AI insights:** ${architecture.ragInsights?.[0] ?? "FedRAMP-aligned design with encryption and audit logging."}

**Estimated cost:** $${architecture.costEstimate.monthlyTotalLow.toFixed(0)}–$${architecture.costEstimate.monthlyTotalHigh.toFixed(0)}/month

The pipeline on the right is ready — click any component for AI-powered recommendations.`;
    await addChatMessage({ projectId, role: "assistant", content: reply });
    return { reply, architecture };
  }

  const history = await getChatMessages(projectId);
  const messages: Message[] = history
    .filter((m) => m.role !== "system")
    .slice(-10)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: [{ text: m.content }],
    }));

  let finalReply = "";
  const maxTurns = 6;

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await converse({
      system: `${SYSTEM_PROMPT}\n\nRetrieved knowledge:\n${ragContext}`,
      messages,
      toolConfig: { tools: TOOL_DEFINITIONS },
    });

    const outputMessage = response.output?.message;
    if (!outputMessage) break;

    const text = textFromContent(outputMessage.content);
    const toolUses = toolUsesFromContent(outputMessage.content);

    if (toolUses.length === 0) {
      finalReply = text;
      messages.push(outputMessage);
      break;
    }

    messages.push(outputMessage);

    const toolResultBlocks = await Promise.all(
      toolUses.map(async (tu) => {
        const result = await executeTool(tu.name!, tu.input as Record<string, unknown>, projectId);
        return {
          toolResult: {
            toolUseId: tu.toolUseId!,
            content: [{ json: result as Record<string, unknown> }],
          },
        };
      })
    );

    messages.push({ role: "user", content: toolResultBlocks as ContentBlock[] });
  }

  if (!finalReply) {
    finalReply =
      "I've analyzed your requirements using GovCloud knowledge retrieval and compliance checks.";
  }

  const architecture = await buildArchitecture(projectId, userMessage, finalReply);
  await saveArchitecture(projectId, architecture);
  await addChatMessage({ projectId, role: "assistant", content: finalReply });

  return { reply: finalReply, architecture };
}

export async function refineArchitecture(
  projectId: string,
  userMessage: string
): Promise<AgentResult> {
  return runAgent(projectId, userMessage);
}
