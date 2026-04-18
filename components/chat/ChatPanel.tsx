"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore, ChatMessage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  studyId: string;
  context: string;
}

export function ChatPanel({ studyId, context }: Props) {
  const { activeStudy, addChatMessage, updateLastAssistantMessage } = useAppStore();
  const messages = activeStudy?.chatMessages ?? [];
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const question = input.trim();
    if (!question || streaming) return;

    setInput("");
    setStreaming(true);

    const userMsg: ChatMessage = { role: "user", content: question };
    addChatMessage(studyId, userMsg);
    addChatMessage(studyId, { role: "assistant", content: "" });

    try {
      const historyForAPI = [...messages, userMsg].slice(-10);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForAPI, context }),
      });

      if (!res.ok || !res.body) throw new Error("Erreur API chat");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        updateLastAssistantMessage(studyId, accumulated);
      }
    } catch (e: any) {
      updateLastAssistantMessage(studyId, `Erreur : ${e.message}`);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-3 py-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Bot className="w-8 h-8 text-violet-400 opacity-60" />
            <p className="text-xs text-neutral-500 max-w-[200px]">
              Pose une question sur l'étude — méthodologie, résultats, statistiques…
            </p>
            <div className="flex flex-col gap-1.5 w-full mt-2">
              {["Quels sont les critères d'inclusion ?", "Analyse les p-values critiques", "Y a-t-il des conflits d'intérêts ?"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-left text-[11px] text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 rounded-lg px-3 py-2 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-violet-500/20" : "bg-emerald-500/20"}`}>
                  {msg.role === "user"
                    ? <User className="w-3 h-3 text-violet-400" />
                    : <Bot className="w-3 h-3 text-emerald-400" />}
                </div>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-500/15 text-violet-100 rounded-tr-none"
                    : "bg-neutral-800 text-neutral-200 rounded-tl-none"
                }`}>
                  {msg.content || (streaming && i === messages.length - 1
                    ? <span className="flex gap-1"><span className="animate-bounce">·</span><span className="animate-bounce [animation-delay:0.15s]">·</span><span className="animate-bounce [animation-delay:0.3s]">·</span></span>
                    : null)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <div className="px-3 py-2 border-t border-neutral-800">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Question sur l'étude…"
            rows={1}
            className="flex-1 bg-neutral-800 text-neutral-200 text-xs rounded-lg px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-neutral-600 min-h-[36px] max-h-[100px]"
            style={{ fieldSizing: "content" } as any}
            disabled={streaming}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 bg-violet-600 hover:bg-violet-500"
            onClick={send}
            disabled={streaming || !input.trim()}
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-neutral-600 mt-1 text-center">Entrée pour envoyer · Shift+Entrée pour sauter une ligne</p>
      </div>
    </div>
  );
}
