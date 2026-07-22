"use client";

import { useEffect, useRef, useState } from "react";
import type { ArchitectureProposal, MigrationAssessment } from "@cloudarch/shared";

interface MigrationChatWorkspaceProps {
  projectId: string;
  initialDescription?: string;
  onAssessmentGenerated?: (assessment: MigrationAssessment, architecture: ArchitectureProposal) => void;
  onGeneratingChange?: (generating: boolean) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STAGES = ["Analyzing Azure", "Mapping services", "Designing AWS", "Security review", "Learning mode"];

function formatMessage(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function MigrationChatWorkspace({
  projectId,
  initialDescription,
  onAssessmentGenerated,
  onGeneratingChange,
}: MigrationChatWorkspaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bootstrapped = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/migration/chat?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length) {
          setMessages(
            data.messages
              .filter((m: { role: string }) => m.role !== "system")
              .map((m: { role: string; content: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              }))
          );
        }
        setHistoryLoaded(true);
      });
  }, [projectId]);

  useEffect(() => {
    if (!historyLoaded || bootstrapped.current) return;
    if (messages.length > 0) {
      bootstrapped.current = true;
      return;
    }
    if (!initialDescription?.trim()) return;
    bootstrapped.current = true;
    postMessage(initialDescription.trim());
  }, [historyLoaded, initialDescription, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading]);

  async function postMessage(text: string) {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: text.trim() }]);
    setInput("");
    setLoading(true);
    onGeneratingChange?.(true);
    try {
      const res = await fetch("/api/migration/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: text.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
      if (data.migrationAssessment && data.architecture && onAssessmentGenerated) {
        onAssessmentGenerated(data.migrationAssessment, data.architecture);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Migration analysis failed.",
        },
      ]);
    } finally {
      setLoading(false);
      onGeneratingChange?.(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    postMessage(input);
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Migration tutor</h2>
        <p className="text-xs text-muted mt-0.5">
          Describe your Azure architecture — I&apos;ll map it to AWS GovCloud
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted leading-relaxed">
              Paste your Azure architecture description. I&apos;ll detect services, map to AWS
              GovCloud, and explain each decision.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "ml-auto bg-accent text-white"
                : "mr-auto bg-background border border-border text-foreground"
            }`}
          >
            <p className="whitespace-pre-wrap">{formatMessage(msg.content)}</p>
          </div>
        ))}
        {loading && (
          <div className="mr-auto bg-background border border-border rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
              {STAGES[stageIndex]}…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={2}
            placeholder="Ask about a service mapping or paste Azure details..."
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex-shrink-0 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
