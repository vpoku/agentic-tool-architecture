import {
  generateFullIac,
  generateMermaidDiagram,
  computeMigrationMetrics,
  type MigrationAssessment,
} from "@cloudarch/shared";
import { analyzeAzureArchitecture } from "@/lib/agent/azure-analyzer";
import { planMigration } from "@/lib/agent/migration-planner";
import { generateMigrationArchitecture } from "@/lib/agent/migration-architecture";
import { reviewSecurity } from "@/lib/agent/security-reviewer";
import { generateLearningContent } from "@/lib/agent/cloud-tutor";
import { retrieveFromKnowledgeBase, formatRagContext } from "@/lib/bedrock/knowledge-base";
import {
  getProject,
  saveMigrationAssessment,
  addChatMessage,
  updateProject,
} from "@/lib/store";
import type { ArchitectureProposal } from "@cloudarch/shared";

export interface MigrationAgentResult {
  reply: string;
  architecture?: ArchitectureProposal;
  migrationAssessment?: MigrationAssessment;
}

function buildMigrationReply(assessment: MigrationAssessment): string {
  const { azureArchitecture, mappings, targetArchitecture, securityReview, migrationPlan } =
    assessment;

  const azureList = azureArchitecture.components
    .map((c) => `- **${c.service}** (${c.category}): ${c.purpose}`)
    .join("\n");

  const mappingList = mappings
    .slice(0, 6)
    .map((m) => `- ${m.azureService} → **${m.awsGovCloudEquivalent}**`)
    .join("\n");

  const pipeline = targetArchitecture.services.map((s) => s.data.label).join(" → ");
  const goodFindings = securityReview.findings.filter((f) => f.severity === "good").length;
  const attentionFindings = securityReview.findings.filter((f) => f.severity !== "good").length;

  return `I've analyzed your Azure architecture and designed an AWS GovCloud migration learning path.

**Application:** ${azureArchitecture.applicationName}
${azureArchitecture.industry ? `**Industry:** ${azureArchitecture.industry}` : ""}

**Detected Azure components:**
${azureList}

**Azure → AWS GovCloud mappings:**
${mappingList}

**Target AWS data flow:** ${pipeline}

**Estimated cost:** $${targetArchitecture.costEstimate.monthlyTotalLow.toFixed(0)}–$${targetArchitecture.costEstimate.monthlyTotalHigh.toFixed(0)}/month

**Security review:** ${goodFindings} good · ${attentionFindings} need attention

**Migration plan:** ${migrationPlan.phases.length} phases — starting with "${migrationPlan.phases[0]?.title ?? "Assessment"}"

**Complexity:** ${assessment.metricsAnalysis.complexityScore}/5 · **Readiness:** ${assessment.metricsAnalysis.readinessScore}/5

Open the **Review** step for your full migration plan, cost and metrics analysis, service mappings, and GovCloud deployment templates. This is educational guidance — not an automatic migration.`;
}

export async function runMigrationAgent(
  projectId: string,
  userMessage: string
): Promise<MigrationAgentResult> {
  const project = await getProject(projectId);
  if (!project) throw new Error("Project not found");
  if (project.projectType !== "migration") {
    throw new Error("This project is not a migration project");
  }

  await addChatMessage({ projectId, role: "user", content: userMessage });
  await updateProject(projectId, { status: "analyzing" });

  const ragResults = await retrieveFromKnowledgeBase(
    `${userMessage} Azure to AWS GovCloud migration mapping`,
    6
  );
  const ragContext = formatRagContext(ragResults);

  const azureArchitecture = analyzeAzureArchitecture(userMessage);
  const { mappings, draftPlan } = planMigration(azureArchitecture, ragContext);
  let targetArchitecture = generateMigrationArchitecture(
    projectId,
    azureArchitecture,
    mappings
  );
  targetArchitecture = {
    ...targetArchitecture,
    generatedIac: generateFullIac(targetArchitecture),
    ragInsights: ragResults.slice(0, 4).map((r) => r.text),
  };
  const securityReview = reviewSecurity(targetArchitecture, mappings);
  const learning = generateLearningContent(targetArchitecture, mappings);
  const mermaidDiagram = generateMermaidDiagram(targetArchitecture);
  const metricsAnalysis = computeMigrationMetrics(
    azureArchitecture,
    mappings,
    targetArchitecture
  );

  const assessment: MigrationAssessment = {
    azureArchitecture,
    mappings,
    targetArchitecture,
    securityReview,
    learning,
    migrationPlan: draftPlan,
    metricsAnalysis,
    mermaidDiagram,
  };

  await saveMigrationAssessment(projectId, assessment);
  const reply = buildMigrationReply(assessment);
  await addChatMessage({ projectId, role: "assistant", content: reply });

  return { reply, architecture: targetArchitecture, migrationAssessment: assessment };
}
