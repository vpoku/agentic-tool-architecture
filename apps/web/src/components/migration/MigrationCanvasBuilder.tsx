"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ArchitectureProposal, MigrationAssessment, Project } from "@cloudarch/shared";
import { computeMigrationMetrics } from "@cloudarch/shared";
import { StepIndicator, MIGRATION_STEPS, type BuilderStep } from "@/components/canvas/StepIndicator";
import { AzureIntakeForm } from "@/components/migration/AzureIntakeForm";
import { PipelineCanvas } from "@/components/pipeline/PipelineCanvas";
import { ArchitectureReportCard } from "@/components/pipeline/ArchitectureReportCard";
import { ArchitectureInsights } from "@/components/pipeline/ArchitectureInsights";
import { MigrationPlanPanel } from "@/components/migration/MigrationPlanPanel";
import { MigrationCostAnalysisPanel } from "@/components/migration/MigrationCostAnalysisPanel";
import { MigrationMetricsAnalysisPanel } from "@/components/migration/MigrationMetricsAnalysisPanel";
import { ServiceMappingTable } from "@/components/migration/ServiceMappingTable";
import { SecurityReviewPanel } from "@/components/migration/SecurityReviewPanel";
import { LearningModePanel } from "@/components/migration/LearningModePanel";
import { AzureAnalysisPanel } from "@/components/migration/AzureAnalysisPanel";
import { ExportTemplatesPanel } from "@/components/deploy/ExportTemplatesPanel";
import { MigrationFollowUpChat } from "@/components/migration/MigrationFollowUpChat";

const THINKING_STAGES = [
  "Analyzing Azure architecture",
  "Mapping services to GovCloud",
  "Designing AWS target",
  "Running security review",
  "Building migration plan",
  "Generating deployment templates",
];

interface MigrationCanvasBuilderProps {
  project?: Project;
  bootstrapMessage?: string;
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-background transition-colors"
      >
        {title}
        <span className="text-muted text-xs">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="border-t border-border">{children}</div>}
    </div>
  );
}

export function MigrationCanvasBuilder({
  project: initialProject,
  bootstrapMessage,
}: MigrationCanvasBuilderProps) {
  const [project, setProject] = useState<Project | undefined>(initialProject);
  const [step, setStep] = useState<BuilderStep>(
    initialProject?.migrationAssessment ? "review" : "describe"
  );
  const [prompt, setPrompt] = useState(bootstrapMessage ?? initialProject?.description ?? "");
  const [generating, setGenerating] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [assessment, setAssessment] = useState<MigrationAssessment | undefined>(
    initialProject?.migrationAssessment
  );
  const [assistantSummary, setAssistantSummary] = useState("");
  const router = useRouter();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (initialProject) setProject(initialProject);
  }, [initialProject]);

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setThinkingStage((i) => (i + 1) % THINKING_STAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [generating]);

  const runAnalysis = useCallback(
    async (projectId: string, message: string) => {
      if (!message.trim() || generating) return;
      setGenerating(true);
      setStep("thinking");
      setThinkingStage(0);
      try {
        const res = await fetch("/api/migration/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, message: message.trim() }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.reply) setAssistantSummary(data.reply);
        if (data.migrationAssessment) {
          setAssessment(data.migrationAssessment);
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  migrationAssessment: data.migrationAssessment,
                  architecture: data.architecture,
                  status: "ready",
                }
              : prev
          );
          setStep("review");
        }
      } catch (err) {
        setAssistantSummary(err instanceof Error ? err.message : "Migration analysis failed.");
        setStep("describe");
      } finally {
        setGenerating(false);
      }
    },
    [generating]
  );

  useEffect(() => {
    if (bootstrapped.current || !project?.projectId) return;
    if (project.migrationAssessment) {
      setAssessment(project.migrationAssessment);
      setStep("review");
      bootstrapped.current = true;
      return;
    }
    if (!bootstrapMessage?.trim()) return;
    bootstrapped.current = true;
    setPrompt(bootstrapMessage);
    void runAnalysis(project.projectId, bootstrapMessage);
  }, [project?.projectId, bootstrapMessage, project?.migrationAssessment, runAnalysis]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || generating) return;

    let projectId = project?.projectId;
    if (!projectId) {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Azure Migration Assessment",
          description: prompt.trim(),
          projectType: "migration",
        }),
      });
      const data = await res.json();
      projectId = data.projectId;
      setProject(data.project);
      router.replace(`/projects/${projectId}/migration?q=${encodeURIComponent(prompt.trim())}`);
    }

    if (!projectId) return;
    await runAnalysis(projectId, prompt);
  }

  const targetArchitecture = assessment?.targetArchitecture;
  const metrics =
    assessment?.metricsAnalysis ??
    (assessment
      ? computeMigrationMetrics(
          assessment.azureArchitecture,
          assessment.mappings,
          assessment.targetArchitecture
        )
      : undefined);

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-y-auto scrollbar-thin">
      {!assessment && step === "describe" && (
        <div className="px-6 pt-8 pb-4 text-center border-b border-border bg-gradient-to-b from-accent-muted/30 to-background">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-2">
            Azure to AWS GovCloud migration
          </h1>
          <p className="text-sm text-muted max-w-xl mx-auto leading-relaxed">
            Paste your Azure architecture and CloudArch will produce a draft AWS GovCloud plan with
            cost analysis, metrics, and learning guidance — without auto-migrating production
            systems.
          </p>
        </div>
      )}

      <StepIndicator step={step} steps={MIGRATION_STEPS} />

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        <div
          className={`lg:w-[420px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card ${
            step === "review" ? "hidden lg:block" : ""
          }`}
        >
          <div className="p-6">
            <div className="flex gap-1 mb-4">
              {(["describe", "thinking", "review"] as BuilderStep[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    if (s === "review" && !assessment) return;
                    if (s === "thinking" && !generating && !assessment) return;
                    setStep(s);
                  }}
                  disabled={
                    (s === "review" && !assessment) ||
                    (s === "thinking" && !generating && !assessment)
                  }
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-colors disabled:opacity-40 ${
                    step === s ? "bg-accent text-white" : "text-muted hover:bg-background"
                  }`}
                >
                  {s === "review" ? "Review" : s === "thinking" ? "Thinking" : "Describe"}
                </button>
              ))}
            </div>

            {step === "describe" && (
              <>
                <h2 className="text-base font-semibold text-foreground mb-1">
                  Describe your Azure architecture
                </h2>
                <p className="text-xs text-muted mb-4">
                  Press Enter to analyze · Shift+Enter for new line
                </p>
                <AzureIntakeForm
                  value={prompt}
                  onChange={setPrompt}
                  onSubmit={handleSubmit}
                  loading={generating}
                  compact
                />
              </>
            )}

            {step === "thinking" && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">Analyzing migration</h2>
                <p className="text-sm text-muted leading-relaxed border border-border rounded-xl p-3 bg-background">
                  {prompt || project?.description || "—"}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
                  {THINKING_STAGES[thinkingStage]}…
                </div>
              </div>
            )}

            {step === "review" && assistantSummary && (
              <div className="hidden lg:block">
                <h2 className="text-base font-semibold text-foreground mb-2">Summary</h2>
                <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto scrollbar-thin">
                  {assistantSummary.replace(/\*\*/g, "")}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-[480px] flex flex-col min-w-0 bg-background">
          {step === "review" && assessment ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              <MigrationPlanPanel plan={assessment.migrationPlan} />

              <MigrationCostAnalysisPanel
                metrics={metrics!}
                awsScoresCost={targetArchitecture?.scores?.cost}
              />

              <MigrationMetricsAnalysisPanel metrics={metrics!} />

              {targetArchitecture?.scores && (
                <ArchitectureReportCard scores={targetArchitecture.scores} />
              )}

              {targetArchitecture && (
                <div className="rounded-xl border border-border overflow-hidden min-h-[360px]">
                  <PipelineCanvas
                    projectId={project?.projectId ?? ""}
                    architecture={targetArchitecture}
                    generating={false}
                    embedded
                  />
                </div>
              )}

              {targetArchitecture && <ArchitectureInsights architecture={targetArchitecture} />}

              <ExportTemplatesPanel
                projectName={project?.name ?? "Migration"}
                generatedIac={targetArchitecture?.generatedIac}
              />

              <CollapsibleSection title="Service mapping (Azure → AWS GovCloud)">
                <ServiceMappingTable mappings={assessment.mappings} />
              </CollapsibleSection>

              <CollapsibleSection title="Security review">
                <SecurityReviewPanel review={assessment.securityReview} />
              </CollapsibleSection>

              <CollapsibleSection title="Learning guide (beginner)" defaultOpen>
                <LearningModePanel learning={assessment.learning} />
              </CollapsibleSection>

              <CollapsibleSection title="Azure source analysis">
                <AzureAnalysisPanel azure={assessment.azureArchitecture} />
              </CollapsibleSection>

              {project?.projectId && (
                <MigrationFollowUpChat
                  projectId={project.projectId}
                  onAssessmentUpdated={(next, arch) => {
                    setAssessment(next);
                    setProject((prev) =>
                      prev
                        ? {
                            ...prev,
                            migrationAssessment: next,
                            architecture: arch,
                          }
                        : prev
                    );
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-[400px] flex flex-col">
              {step === "thinking" && (
                <div className="px-6 py-3 border-b border-border bg-card flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
                  <p className="text-sm text-muted">{THINKING_STAGES[thinkingStage]}…</p>
                </div>
              )}
              {project?.projectId ? (
                <PipelineCanvas
                  projectId={project.projectId}
                  architecture={targetArchitecture}
                  generating={generating || step === "thinking"}
                  embedded
                />
              ) : (
                <div className="flex-1 flex items-center justify-center m-4 rounded-xl border-2 border-dashed border-border bg-card/50">
                  <div className="text-center max-w-sm px-6">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Your migration plan will appear here
                    </p>
                    <p className="text-xs text-muted leading-relaxed">
                      Paste your Azure architecture on the left and click Analyze to begin.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
