"use client";

import { useState, useRef, useEffect } from "react";
import { Flash, SendDiagonal, User, Sparks, Refresh, InfoCircle } from "iconoir-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiChatProps {
  context: string;
}

const SUGGESTED_QUESTIONS = [
  "Which project has the highest burnout risk?",
  "Analyze team's psychological safety.",
  "Predict potential delays in current sprints.",
];

export function AiChat({ context }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, context }),
      });

      if (!res.body) {
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated };
          return updated;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  }

  const clearChat = () => setMessages([]);

  if (!mounted) return <div className="h-[600px] rounded-3xl border bg-card/50" />;

  return (
    <div className="flex flex-col h-[600px] rounded-3xl border bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand text-brand-primary shadow-sm">
            <Flash className="h-4 w-4 fill-current" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">Signal AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none">Online & Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            className="h-8 w-8 rounded-full hover:bg-muted/50 text-muted-foreground"
            title="Clear Chat"
          >
            <Refresh className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted/50 text-muted-foreground"
          >
            <InfoCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-muted">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative">
              <div className="absolute -inset-4 bg-brand/20 blur-2xl rounded-full" />
              <Sparks className="h-12 w-12 text-brand relative" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-foreground">How can I help you today?</h4>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                I can analyze your team&apos;s signals, predict burnout, or provide insights on project health.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-4 py-2 rounded-full border bg-background/50 hover:bg-brand/10 hover:border-brand/40 text-xs font-medium transition-all duration-200 shadow-sm whitespace-nowrap active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border shadow-sm",
                m.role === "assistant"
                  ? "bg-muted text-foreground"
                  : "bg-brand-primary text-white border-brand-primary/50"
              )}
            >
              {m.role === "assistant" ? <Flash className="h-4 w-4 fill-brand text-brand" /> : <User className="h-4 w-4" />}
            </div>
            <div
              className={cn(
                "group relative flex flex-col gap-2 max-w-[85%] sm:max-w-[70%]",
                m.role === "user" ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                  m.role === "user"
                    ? "bg-brand-primary text-white rounded-tr-none"
                    : "bg-muted/40 text-foreground border border-border/50 rounded-tl-none"
                )}
              >
                {m.content || (
                  <div className="flex gap-1 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                {m.role === "assistant" ? "Signal AI" : "You"}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="p-6 pt-0">
        <div className="relative group overflow-hidden rounded-2xl border bg-background/50 shadow-inner focus-within:ring-2 focus-within:ring-brand/50 transition-all duration-300">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand/30 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <input
            className="w-full bg-transparent px-5 py-4 text-sm outline-none placeholder:text-muted-foreground/60"
            placeholder="Ask anything about your team signals..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            disabled={loading}
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground/60 px-2 uppercase tracking-widest">
                Press Enter to send
              </span>
            </div>
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className={cn(
                "group/btn relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 active:scale-95",
                input.trim()
                  ? "bg-brand text-brand-primary shadow-lg shadow-brand/20"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <SendDiagonal className="h-4 w-4 rotate-45 group-hover/btn:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
