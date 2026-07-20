"use client";

import { useEffect, useRef, useState } from "react";
import type { ArchitectureProposal } from "@cloudarch/shared";

interface ChatWorkspaceProps {
  projectId: string;
  initialDescription?: string;
  onArchitectureGenerated?: (architecture: ArchitectureProposal) => void;
  onGeneratingChange?: (generating: boolean) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWorkspace({
  projectId,
  initialDescription,
  onArchitectureGenerated,
  onGeneratingChange,
}: ChatWorkspaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bootstrapped = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/chat?projectId=${projectId}`)
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

  async function postMessage(text: string) {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: text.trim() }]);
    setInput("");
    setLoading(true);
    onGeneratingChange?.(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: text.trim() }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
      if (data.architecture && onArchitectureGenerated) {
        onArchitectureGenerated(data.architecture);
      }
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
        <h2 className="text-sm font-semibold text-foreground">Architecture assistant</h2>
        <p className="text-xs text-muted mt-0.5">
          Describe your project — I&apos;ll design a GovCloud pipeline
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted leading-relaxed">
              Example: &ldquo;We need a FedRAMP-compliant document intake system handling 10k
              documents per day with PII encryption.&rdquo;
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
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted animate-pulse-soft">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Designing your architecture...
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
            placeholder="Describe your project or ask a question..."
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
