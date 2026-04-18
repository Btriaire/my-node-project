"use client";

import { StudyAnalysis } from "@/lib/store";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, ListChecks, Network, Loader2, AlertCircle, MessageSquare, FlaskConical } from "lucide-react";
import { ExportPDF } from "@/components/export/ExportPDF";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ExpertPanel } from "@/components/insights/ExpertPanel";

interface Props { study: StudyAnalysis }

export function InsightPanel({ study }: Props) {
  const { activeTab, setActiveTab } = useAppStore();
  const isAnalyzing = study.status === "analyzing";

  if (isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-500">
        <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
        <p className="text-xs">Analyse en cours…</p>
      </div>
    );
  }

  const tabs = [
    { id: "insights" as const, label: "Insights", icon: Sparkles },
    { id: "chat" as const, label: "Chat", icon: MessageSquare },
    { id: "expert" as const, label: "Expert", icon: FlaskConical },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-neutral-800 shrink-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              activeTab === id
                ? "border-violet-500 text-violet-300"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "insights" && (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {study.status === "ready" && (
                <div className="flex justify-end">
                  <ExportPDF study={study} />
                </div>
              )}

              {study.pitch && (
                <Card className="bg-neutral-900 border-neutral-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-medium text-white">Pitch</h3>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">{study.pitch}</p>
                </Card>
              )}

              {study.keyTakeaways?.length ? (
                <Card className="bg-neutral-900 border-neutral-800 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ListChecks className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-medium text-white">Key Takeaways</h3>
                  </div>
                  <ul className="space-y-2">
                    {study.keyTakeaways.map((kta, i) => (
                      <li key={i} className="flex gap-2 text-xs text-neutral-300">
                        <Badge variant="outline" className="shrink-0 border-emerald-800 text-emerald-400 h-5 text-[10px]">{i + 1}</Badge>
                        <span className="leading-relaxed">{kta}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              {study.limitations?.length ? (
                <Card className="bg-neutral-900 border-amber-900/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-medium text-white">Limites de l'étude</h3>
                  </div>
                  <ul className="space-y-2">
                    {study.limitations.map((lim, i) => (
                      <li key={i} className="flex gap-2 text-xs text-amber-200/80">
                        <span className="text-amber-500 shrink-0">⚠</span>
                        <span className="leading-relaxed">{lim}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              {study.entities?.length ? (
                <Card className="bg-neutral-900 border-neutral-800 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Network className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-medium text-white">Entités clés</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {study.entities.map((e) => (
                      <Badge key={e.id} className="text-[11px]" style={{
                        backgroundColor: typeColor(e.type) + "20",
                        color: typeColor(e.type),
                        border: "none",
                      }}>
                        {e.label}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ) : null}
            </div>
          </ScrollArea>
        )}

        {activeTab === "chat" && (
          <ChatPanel studyId={study.id} context={study.extractedText} />
        )}

        {activeTab === "expert" && (
          <ExpertPanel studyId={study.id} text={study.extractedText} />
        )}
      </div>
    </div>
  );
}

function typeColor(type: string) {
  const colors: Record<string, string> = {
    drug: "#a78bfa", target: "#60a5fa", disease: "#f87171",
    endpoint: "#34d399", population: "#fbbf24",
  };
  return colors[type] ?? "#94a3b8";
}
