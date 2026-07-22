"use client";

import { useState } from "react";
import type { MigrationAssessment } from "@cloudarch/shared";

interface MigrationExportDrawerProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  assessment?: MigrationAssessment;
}

function buildRunbook(assessment: MigrationAssessment): string {
  const lines = [
    `# Migration Runbook: ${assessment.azureArchitecture.applicationName}`,
    "",
    assessment.migrationPlan.summary,
    "",
  ];
  for (const phase of assessment.migrationPlan.phases) {
    lines.push(`## ${phase.title}`, "", phase.description, "", "**Tasks:**");
    phase.tasks.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
  }
  return lines.join("\n");
}

function buildLearningSummary(assessment: MigrationAssessment): string {
  const lines = [
    `# Learning Summary: ${assessment.azureArchitecture.applicationName}`,
    "",
    "## Service Mappings",
    "",
  ];
  for (const m of assessment.mappings) {
    lines.push(`### ${m.azureService} → ${m.awsGovCloudEquivalent}`, "", m.reason, "");
  }
  lines.push("## Beginner Explanations", "");
  for (const l of assessment.learning) {
    lines.push(`### ${l.serviceName}`, l.beginner, "");
  }
  return lines.join("\n");
}

export function MigrationExportDrawer({
  open,
  onClose,
  projectName,
  assessment,
}: MigrationExportDrawerProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"runbook" | "learning" | "mermaid">("runbook");

  if (!open) return null;

  const tabs = assessment
    ? [
        { id: "runbook" as const, label: "Migration runbook", content: buildRunbook(assessment) },
        {
          id: "learning" as const,
          label: "Learning summary",
          content: buildLearningSummary(assessment),
        },
        {
          id: "mermaid" as const,
          label: "Mermaid diagram",
          content: assessment.mermaidDiagram ?? "",
        },
      ]
    : [];

  const activeContent = tabs.find((t) => t.id === activeTab)?.content ?? "";

  async function copy(key: string) {
    await navigator.clipboard.writeText(activeContent);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-lg h-full bg-card border-l border-border flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Export migration guide</h2>
            <p className="text-xs text-muted">{projectName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground rounded-lg">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {!assessment ? (
            <p className="text-sm text-muted">Run a migration assessment first.</p>
          ) : (
            <>
              <div className="flex border-b border-border mb-4 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-accent border-b-2 border-accent"
                        : "text-muted"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <pre className="text-xs font-mono leading-relaxed bg-background border border-border rounded-xl p-4 max-h-96 overflow-auto scrollbar-thin whitespace-pre-wrap">
                {activeContent}
              </pre>
              <button
                onClick={() => copy(activeTab)}
                className="mt-4 w-full bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2.5 rounded-lg"
              >
                {copied === activeTab ? "Copied!" : "Copy to clipboard"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
