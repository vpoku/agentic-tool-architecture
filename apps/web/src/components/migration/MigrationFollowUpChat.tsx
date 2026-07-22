"use client";

import { useState } from "react";
import type { ArchitectureProposal, MigrationAssessment } from "@cloudarch/shared";

interface MigrationFollowUpChatProps {
  projectId: string;
  onAssessmentUpdated: (
    assessment: MigrationAssessment,
    architecture: ArchitectureProposal
  ) => void;
}

export function MigrationFollowUpChat({
  projectId,
  onAssessmentUpdated,
}: MigrationFollowUpChatProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setReply(null);
    try {
      const res = await fetch("/api/migration/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: input.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.reply) setReply(data.reply);
      if (data.migrationAssessment && data.architecture) {
        onAssessmentUpdated(data.migrationAssessment, data.architecture);
      }
      setInput("");
    } catch (err) {
      setReply(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Ask a follow-up</p>
        <p className="text-xs text-muted mt-0.5">
          Refine your Azure description or ask about a specific service mapping.
        </p>
      </div>
      {reply && (
        <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap border border-border rounded-lg p-3 bg-background">
          {reply.replace(/\*\*/g, "")}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. What if we use RDS instead of DynamoDB?"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          {loading ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
