"use client";

import { useState } from "react";
import type { GeneratedIac } from "@cloudarch/shared";

interface ExportTemplatesPanelProps {
  projectName: string;
  generatedIac?: GeneratedIac;
}

export function ExportTemplatesPanel({ projectName, generatedIac }: ExportTemplatesPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"copilot" | "cdk" | "script" | "readme">("copilot");

  if (!generatedIac) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
        <p className="text-sm text-muted">
          GovCloud deployment templates will appear here after analysis completes.
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
    { id: "script" as const, label: "deploy.sh", content: generatedIac.deployScript },
    { id: "readme" as const, label: "README", content: generatedIac.readme },
  ];

  const activeContent = tabs.find((t) => t.id === activeTab)?.content ?? "";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-accent-muted/20">
        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">
          GovCloud deployment templates
        </p>
        <p className="text-xs text-muted">
          Templates only — not deployed by CloudArch. Copy into Cursor or GitHub Copilot to scaffold
          in <strong className="text-foreground">us-gov-west-1</strong> with{" "}
          <code className="text-[10px]">AWS_PROFILE=govcloud</code>.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 p-4 border-b border-border bg-background/50">
        {[
          { step: "1", title: "Copy prompt", desc: "Paste into your AI IDE chat" },
          { step: "2", title: "Add to repo", desc: "Save CDK stack + deploy.sh" },
          { step: "3", title: "Deploy manually", desc: "Run ./scripts/deploy.sh in GovCloud" },
        ].map((item) => (
          <div key={item.step} className="rounded-lg border border-border bg-card p-3">
            <span className="text-xs font-bold text-accent">{item.step}</span>
            <p className="text-sm font-medium mt-1">{item.title}</p>
            <p className="text-xs text-muted mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
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
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => copyText(activeTab, activeContent)}
          className="px-4 py-3 text-xs font-medium text-accent hover:bg-accent-muted transition-colors"
        >
          {copied === activeTab ? "Copied!" : "Copy"}
        </button>
      </div>

      <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed max-h-[320px] overflow-y-auto bg-background text-foreground scrollbar-thin">
        {activeContent}
      </pre>

      <div className="px-4 py-3 border-t border-border text-xs text-muted">
        Project: <span className="text-foreground font-medium">{projectName}</span>
      </div>
    </div>
  );
}
