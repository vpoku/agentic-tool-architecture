"use client";

import { useEffect, useState, useRef } from "react";

interface ChatPanelProps {
  projectId: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/chat?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) {
          setMessages(
            data.messages
              .filter((m: { role: string }) => m.role !== "system")
              .map((m: { role: string; content: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              }))
          );
        }
      });
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: text }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        if (data.architecture) {
          window.location.reload();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-outline-variant">
        <h3 className="font-display text-lg font-bold text-on-surface">Architecture Chat</h3>
        <p className="text-body-sm text-on-surface-variant">
          Ask questions or refine your design
        </p>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-body-sm text-on-surface-variant thinking-indicator">
            Waiting for analysis...
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-xl p-3 text-body-sm ${
              msg.role === "user"
                ? "bg-primary-container text-on-primary-container ml-4"
                : "bg-surface-container mr-4 text-on-surface"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <p className="text-body-sm text-on-surface-variant thinking-indicator">
            Analyzing with GovCloud knowledge...
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-outline-variant">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about services, costs, compliance..."
            className="flex-grow rounded-lg border border-outline-variant px-3 py-2 text-body-sm bg-surface focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
