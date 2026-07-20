import type { Message, ContentBlock } from "@aws-sdk/client-bedrock-runtime";
import {
  converse,
  textFromContent,
  toolUsesFromContent,
  isMockMode,
} from "@/lib/bedrock/client";
import { TOOL_DEFINITIONS, executeTool, buildMockArchitecture } from "@/lib/agent/tools";
import {
  generateFullIac,
  ArchitectureProposalSchema,
  type ArchitectureProposal,
} from "@cloudarch/shared";
import {
  getProject,
  saveArchitecture,
  addChatMessage,
  getChatMessages,
} from "@/lib/store";

const SYSTEM_PROMPT = `You are CloudArch Architect, an expert AWS GovCloud solutions architect helping students and non-technical developers learn cloud infrastructure.

Rules:
- Recommend ONLY services available in AWS GovCloud (us-gov-west-1, us-gov-east-1)
- Always explain tradeoffs in plain English
- Flag FedRAMP, ITAR, and HIPAA compliance considerations
- Use tools to lookup services, compare options, estimate costs, and check compliance
- When proposing an architecture, describe services, data flow, and security controls
- Never recommend commercial-only AWS services (e.g., Amplify in GovCloud)
- Be educational: explain WHY each service is chosen

After gathering enough context via tools, summarize the proposed architecture clearly.`;

export interface AgentResult {
  reply: string;
  architecture?: ArchitectureProposal;
}

export async function runAgent(
  projectId: string,
  userMessage: string
): Promise<AgentResult> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");

  await addChatMessage({ projectId, role: "user", content: userMessage });

  if (isMockMode()) {
    const architecture = buildMockArchitecture(projectId, userMessage);
    architecture.generatedIac = generateFullIac(architecture);
    await saveArchitecture(projectId, architecture);
    const reply = `I've analyzed your requirements and designed a GovCloud architecture for "${project.name}".

**Summary:** ${architecture.summary}

**Services:** ${architecture.services.map((s) => s.data.label).join(", ")}

**Compliance:** ${architecture.compliance.framework} ${architecture.compliance.level} — ${architecture.compliance.flags.length} items flagged for review.

**Estimated cost:** $${architecture.costEstimate.monthlyTotalLow.toFixed(0)}–$${architecture.costEstimate.monthlyTotalHigh.toFixed(0)}/month

Explore the pipeline on the right — click any service for pricing and recommendations. Use **Deploy to AWS** when you're ready to export scripts for your AI IDE.`;
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

  let architecture: ArchitectureProposal | undefined;
  let finalReply = "";
  const maxTurns = 6;

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await converse({
      system: SYSTEM_PROMPT,
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

    const toolResultBlocks = toolUses.map((tu) => {
      const result = executeTool(tu.name!, tu.input as Record<string, unknown>, projectId);
      return {
        toolResult: {
          toolUseId: tu.toolUseId!,
          content: [{ json: result as Record<string, unknown> }],
        },
      };
    });

    messages.push({ role: "user", content: toolResultBlocks as ContentBlock[] });
  }

  if (!finalReply) {
    finalReply =
      "I've analyzed your requirements using GovCloud service lookups and compliance checks. Click services in the pipeline for details.";
  }

  architecture = buildMockArchitecture(projectId, userMessage);
  architecture.generatedIac = generateFullIac(architecture);
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
