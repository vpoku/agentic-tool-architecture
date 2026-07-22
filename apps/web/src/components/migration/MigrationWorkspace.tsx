"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { ArchitectureProposal, MigrationAssessment, Project } from "@cloudarch/shared";
import { MigrationChatWorkspace } from "@/components/migration/MigrationChatWorkspace";
import { AzureAnalysisPanel } from "@/components/migration/AzureAnalysisPanel";
import { ServiceMappingTable } from "@/components/migration/ServiceMappingTable";
import { SecurityReviewPanel } from "@/components/migration/SecurityReviewPanel";
import { LearningModePanel } from "@/components/migration/LearningModePanel";
import { MigrationPlanPanel } from "@/components/migration/MigrationPlanPanel";
import { MermaidDiagram } from "@/components/migration/MermaidDiagram";
import { PipelineCanvas } from "@/components/pipeline/PipelineCanvas";
import { MigrationExportDrawer } from "@/components/migration/MigrationExportDrawer";
import { SidebarToggle } from "@/components/layout/AppShell";

const TABS = [
  { id: "azure", label: "Azure Source" },
  { id: "target", label: "AWS Target" },
  { id: "mapping", label: "Mapping" },
  { id: "security", label: "Security" },
  { id: "learn", label: "Learn" },
  { id: "plan", label: "Plan" },
  { id: "diagram", label: "Diagram" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface MigrationWorkspaceProps {
  project: Project;
  bootstrapMessage?: string;
}

export function MigrationWorkspace({ project: initialProject, bootstrapMessage }: MigrationWorkspaceProps) {
  const [project, setProject] = useState(initialProject);
  const [assessment, setAssessment] = useState<MigrationAssessment | undefined>(
    initialProject.migrationAssessment
  );
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("azure");
  const [showExport, setShowExport] = useState(false);
  const router = useRouter();

  const handleAssessmentGenerated = useCallback(
    (next: MigrationAssessment, architecture: ArchitectureProposal) => {
      setAssessment(next);
      setProject((prev) => ({
        ...prev,
        migrationAssessment: next,
        architecture,
        status: "ready",
      }));
      setActiveTab("mapping");
      router.refresh();
    },
    [router]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-5 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <SidebarToggle />
          <div>
            <p className="text-sm font-semibold text-foreground truncate">{project.name}</p>
            <p className="text-[10px] text-accent uppercase tracking-wider">Migration assessment</p>
          </div>
        </div>
        <button
          onClick={() => setShowExport(true)}
          disabled={!assessment}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Export
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="w-[380px] flex-shrink-0 border-r border-border min-h-0">
          <MigrationChatWorkspace
            projectId={project.projectId}
            initialDescription={bootstrapMessage}
            onAssessmentGenerated={handleAssessmentGenerated}
            onGeneratingChange={setGenerating}
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col bg-background">
          <div className="flex border-b border-border overflow-x-auto scrollbar-thin flex-shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "text-accent border-b-2 border-accent bg-accent-muted/30"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            {!assessment && !generating && (
              <div className="flex items-center justify-center h-full p-8">
                <p className="text-sm text-muted text-center max-w-sm">
                  Send your Azure architecture description in the chat. Results will appear here
                  across Azure Source, Mapping, Security, Learning, and Plan tabs.
                </p>
              </div>
            )}

            {generating && !assessment && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted animate-pulse-soft">
                  Running migration agents…
                </p>
              </div>
            )}

            {assessment && activeTab === "azure" && (
              <AzureAnalysisPanel azure={assessment.azureArchitecture} />
            )}
            {assessment && activeTab === "target" && (
              <PipelineCanvas
                projectId={project.projectId}
                architecture={assessment.targetArchitecture}
                generating={false}
              />
            )}
            {assessment && activeTab === "mapping" && (
              <ServiceMappingTable mappings={assessment.mappings} />
            )}
            {assessment && activeTab === "security" && (
              <SecurityReviewPanel review={assessment.securityReview} />
            )}
            {assessment && activeTab === "learn" && (
              <LearningModePanel learning={assessment.learning} />
            )}
            {assessment && activeTab === "plan" && (
              <MigrationPlanPanel plan={assessment.migrationPlan} />
            )}
            {assessment && activeTab === "diagram" && assessment.mermaidDiagram && (
              <MermaidDiagram source={assessment.mermaidDiagram} />
            )}
          </div>
        </div>
      </div>

      <MigrationExportDrawer
        open={showExport}
        onClose={() => setShowExport(false)}
        projectName={project.name}
        assessment={assessment}
      />
    </div>
  );
}
