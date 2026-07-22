"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@cloudarch/shared";
import { PipelineCanvas } from "@/components/pipeline/PipelineCanvas";
import { ArchitectureReportCard } from "@/components/pipeline/ArchitectureReportCard";
import { ArchitectureInsights } from "@/components/pipeline/ArchitectureInsights";
import { RecentlyBuilt } from "@/components/canvas/RecentlyBuilt";
import { CanvasHelpSection } from "@/components/canvas/CanvasHelpSection";
import { StepIndicator, type BuilderStep } from "@/components/canvas/StepIndicator";
import { BuildLearningGuide } from "@/components/canvas/BuildLearningGuide";
import { ExportTemplatesPanel } from "@/components/deploy/ExportTemplatesPanel";

const EXAMPLE_PROMPTS = [
  "A scalable web application with a load balancer, application servers, and a managed database on AWS GovCloud.",
  "We need to store classified documents and let employees search them.",
  "A serverless API using Lambda, API Gateway, and DynamoDB for 10k requests per day.",
  "FedRAMP-compliant document intake handling 10k docs per day with PII encryption.",
  "Real-time analytics pipeline with Kinesis, Lambda, and OpenSearch.",
];

const SURPRISE_PROMPTS = [
  "Multi-AZ microservices on ECS with RDS PostgreSQL and CloudFront CDN.",
  "Zero-trust network with VPC endpoints, PrivateLink, and IAM Identity Center.",
  "Event-driven data lake: S3, Glue, Athena, and QuickSight for compliance reporting.",
];

interface CanvasBuilderProps {
  project?: Project;
  bootstrapMessage?: string;
}

export function CanvasBuilder({ project: initialProject, bootstrapMessage }: CanvasBuilderProps) {
  const [project, setProject] = useState<Project | undefined>(initialProject);
  const [step, setStep] = useState<BuilderStep>(
    initialProject?.architecture ? "review" : "describe"
  );
  const [prompt, setPrompt] = useState(bootstrapMessage ?? "");
  const [generating, setGenerating] = useState(false);
  const [assistantSummary, setAssistantSummary] = useState<string>("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const router = useRouter();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (initialProject) setProject(initialProject);
  }, [initialProject]);

  useEffect(() => {
    if (bootstrapped.current || !project?.projectId) return;
    if (project.architecture) {
      setStep("review");
      bootstrapped.current = true;
      return;
    }
    if (!bootstrapMessage?.trim()) return;
    bootstrapped.current = true;
    setPrompt(bootstrapMessage);
    void generateArchitecture(project.projectId, bootstrapMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.projectId, bootstrapMessage, project?.architecture]);

  const generateArchitecture = useCallback(
    async (projectId: string, message: string) => {
      if (!message.trim() || generating) return;
      setGenerating(true);
      setStep("thinking");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, message: message.trim() }),
        });
        const data = await res.json();
        if (data.reply) setAssistantSummary(data.reply);
        if (data.architecture) {
          setProject((prev) =>
            prev
              ? { ...prev, architecture: data.architecture, status: "ready" }
              : prev
          );
          setStep("review");
        }
      } finally {
        setGenerating(false);
      }
    },
    [generating]
  );

  async function handleGenerate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!prompt.trim() || generating) return;

    let projectId = project?.projectId;
    if (!projectId) {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: prompt.trim() }),
      });
      const data = await res.json();
      projectId = data.projectId;
      setProject(data.project);
      router.replace(`/projects/${projectId}`);
    }

    if (!projectId) return;
    await generateArchitecture(projectId, prompt);
  }

  function handleSurpriseMe() {
    const pick = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    setPrompt(pick);
  }

  function tryAnotherExample() {
    setExampleIndex((i) => (i + 1) % EXAMPLE_PROMPTS.length);
    setPrompt(EXAMPLE_PROMPTS[(exampleIndex + 1) % EXAMPLE_PROMPTS.length]);
  }

  const architecture = project?.architecture;

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-y-auto scrollbar-thin">
      {!architecture && step === "describe" && (
        <div className="px-6 pt-8 pb-4 text-center border-b border-border bg-gradient-to-b from-accent-muted/30 to-background">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-2">
            Build your GovCloud architecture
          </h1>
          <p className="text-sm text-muted max-w-xl mx-auto leading-relaxed">
            Describe what you want to build — CloudArch teaches you AWS GovCloud architecture as it
            designs your system. Perfect for students and first-time builders.
          </p>
        </div>
      )}

      <StepIndicator step={step} />

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
                    if (s === "review" && !architecture) return;
                    if (s === "thinking" && !generating && !architecture) return;
                    setStep(s);
                  }}
                  disabled={
                    (s === "review" && !architecture) ||
                    (s === "thinking" && !generating && !architecture)
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
                  Describe the architecture you want to build
                </h2>
                <p className="text-xs text-muted mb-4">
                  Press Enter to generate · Shift+Enter for new line
                </p>
                <form onSubmit={handleGenerate}>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    rows={5}
                    placeholder="A scalable web application with a load balancer, two application servers, and a managed database."
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent mb-3"
                  />
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="submit"
                      disabled={generating || !prompt.trim()}
                      className="flex-1 min-w-[140px] bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
                    >
                      {generating ? "Thinking…" : "Generate Architecture"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSurpriseMe}
                      className="text-sm font-medium text-muted border border-border hover:border-accent hover:text-accent px-4 py-2.5 rounded-lg transition-colors"
                    >
                      Surprise Me
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={tryAnotherExample}
                    className="text-xs text-muted hover:text-accent transition-colors"
                  >
                    Try another: {EXAMPLE_PROMPTS[exampleIndex].slice(0, 48)}…
                  </button>
                </form>
              </>
            )}

            {step === "thinking" && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">CloudArch is thinking</h2>
                <p className="text-sm text-muted leading-relaxed border border-border rounded-xl p-3 bg-background">
                  {prompt || project?.description || "—"}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
                  OpenSearch RAG + AI is designing your GovCloud architecture…
                </div>
                <button
                  type="button"
                  onClick={() => setStep("describe")}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Edit description
                </button>
              </div>
            )}

            {step === "review" && assistantSummary && (
              <div className="hidden lg:block">
                <h2 className="text-base font-semibold text-foreground mb-2">AI summary</h2>
                <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto scrollbar-thin">
                  {assistantSummary.replace(/\*\*/g, "")}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-[480px] flex flex-col min-w-0 bg-background">
          {step === "review" && architecture ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              {architecture.scores && (
                <ArchitectureReportCard scores={architecture.scores} />
              )}
              {assistantSummary && (
                <div className="rounded-xl border border-border bg-card p-4 lg:hidden">
                  <p className="text-[10px] font-bold text-accent uppercase mb-2">AI summary</p>
                  <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">
                    {assistantSummary.replace(/\*\*/g, "")}
                  </p>
                </div>
              )}
              <div className="rounded-xl border border-border overflow-hidden min-h-[360px]">
                <PipelineCanvas
                  projectId={project?.projectId ?? ""}
                  architecture={architecture}
                  generating={false}
                  embedded
                />
              </div>
              <ArchitectureInsights architecture={architecture} />
              <BuildLearningGuide architecture={architecture} />
              <ExportTemplatesPanel
                projectName={project?.name ?? "Architecture"}
                generatedIac={architecture.generatedIac}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-[400px] flex flex-col">
              {step === "thinking" && (
                <div className="px-6 py-3 border-b border-border bg-card flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
                  <p className="text-sm text-muted">
                    OpenSearch RAG + AI is designing your GovCloud backend pipeline…
                  </p>
                </div>
              )}
              {project?.projectId ? (
                <PipelineCanvas
                  projectId={project.projectId}
                  architecture={architecture}
                  generating={generating || step === "thinking"}
                  embedded
                />
              ) : (
                <div className="flex-1 flex items-center justify-center m-4 rounded-xl border-2 border-dashed border-border bg-card/50">
                  <div className="text-center max-w-sm px-6">
                    <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-7 h-7 text-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Your architecture will appear here
                    </p>
                    <p className="text-xs text-muted leading-relaxed">
                      Describe your cloud system above and click Generate to begin learning AWS
                      GovCloud architecture.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!architecture && step === "describe" && (
        <>
          <RecentlyBuilt />
          <CanvasHelpSection />
        </>
      )}
    </div>
  );
}
