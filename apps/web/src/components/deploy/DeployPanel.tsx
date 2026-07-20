"use client";

import { useState } from "react";
import type { GeneratedIac } from "@cloudarch/shared";

interface DeployPanelProps {
  projectName: string;
  generatedIac?: GeneratedIac;
}

export function DeployPanel({ projectName, generatedIac }: DeployPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"copilot" | "cdk" | "script">("copilot");

  if (!generatedIac) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-muted text-sm">
          Generate an architecture first, then return here to export deployment scripts.
        </p>
      </div>
    );
  }

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const tabs = [
    { id: "copilot" as const, label: "Copilot prompt", content: generatedIac.copilotPrompt },
    { id: "cdk" as const, label: "CDK stack", content: generatedIac.cdk },
    { id: "script" as const, label: "Deploy script", content: generatedIac.deployScript },
  ];

  const activeContent = tabs.find((t) => t.id === activeTab)?.content ?? "";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Deploy to AWS</h1>
        <p className="text-sm text-muted leading-relaxed">
          Copy the Copilot prompt into your AI IDE (Cursor, GitHub Copilot, etc.) along with the
          generated CDK stack. Your AI assistant will help wire application logic and run the deploy
          script against AWS GovCloud.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { step: "1", title: "Copy prompt", desc: "Paste into your AI IDE chat" },
          { step: "2", title: "Add to repo", desc: "Save CDK stack + deploy.sh" },
          { step: "3", title: "Deploy", desc: "Run ./scripts/deploy.sh in GovCloud" },
        ].map((item) => (
          <div key={item.step} className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs font-bold text-accent">{item.step}</span>
            <p className="text-sm font-medium mt-1">{item.title}</p>
            <p className="text-xs text-muted mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-accent border-b-2 border-accent bg-accent-muted/50"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => copyText(activeTab, activeContent)}
            className="px-4 py-3 text-sm font-medium text-accent hover:bg-accent-muted transition-colors"
          >
            {copied === activeTab ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed max-h-[480px] overflow-y-auto bg-background text-foreground scrollbar-thin">
          {activeContent}
        </pre>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-accent-muted/30 p-4">
        <p className="text-sm text-foreground">
          <strong>Project:</strong> {projectName}
        </p>
        <p className="text-xs text-muted mt-2">{generatedIac.readme.split("\n").slice(0, 4).join("\n")}</p>
      </div>
    </div>
  );
}
