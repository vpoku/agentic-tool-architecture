"use client";

import { useState } from "react";

export function MermaidDiagram({ source }: { source: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-muted">Mermaid diagram — paste into docs or Mermaid Live Editor</p>
        <button
          onClick={copy}
          className="text-xs font-medium text-accent hover:underline"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="rounded-xl border border-border bg-background p-4 text-xs font-mono leading-relaxed overflow-x-auto scrollbar-thin">
        {source}
      </pre>
    </div>
  );
}
