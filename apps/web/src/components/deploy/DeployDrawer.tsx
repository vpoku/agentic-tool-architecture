"use client";

import { useState } from "react";
import type { GeneratedIac } from "@cloudarch/shared";

interface DeployDrawerProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  generatedIac?: GeneratedIac;
}

export function DeployDrawer({ open, onClose, projectName, generatedIac }: DeployDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"copilot" | "cdk" | "script">("copilot");

  if (!open) return null;

  const tabs = generatedIac
    ? [
        { id: "copilot" as const, label: "AI IDE prompt", content: generatedIac.copilotPrompt },
        { id: "cdk" as const, label: "CDK stack", content: generatedIac.cdk },
        { id: "script" as const, label: "Deploy script", content: generatedIac.deployScript },
      ]
    : [];

  const activeContent = tabs.find((t) => t.id === activeTab)?.content ?? "";

  async function copyPrompt() {
    if (!activeContent) return;
    await navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-lg h-full bg-card border-l border-border shadow-panel flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Deploy on AWS</h2>
            <p className="text-xs text-muted mt-0.5">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-background"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
          {!generatedIac ? (
            <p className="text-sm text-muted">
              Generate an architecture first, then return here to copy deployment scripts for your
              AI IDE (Cursor, GitHub Copilot, etc.).
            </p>
          ) : (
            <>
              <p className="text-sm text-muted leading-relaxed mb-4">
                Copy the prompt below into your AI IDE. Paste it alongside the generated CDK stack
                so Copilot can wire application logic and run the deploy script against AWS
                GovCloud.
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { step: "1", title: "Copy prompt" },
                  { step: "2", title: "Save CDK files" },
                  { step: "3", title: "Run deploy.sh" },
                ].map((s) => (
                  <div key={s.step} className="rounded-lg border border-border p-2 text-center">
                    <span className="text-[10px] font-bold text-accent">{s.step}</span>
                    <p className="text-[11px] font-medium mt-0.5">{s.title}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex border-b border-border overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? "text-accent border-b-2 border-accent bg-accent-muted/50"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <pre className="p-3 text-[11px] font-mono leading-relaxed max-h-64 overflow-auto bg-background scrollbar-thin">
                  {activeContent}
                </pre>
              </div>

              <button
                onClick={copyPrompt}
                className="mt-4 w-full bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
