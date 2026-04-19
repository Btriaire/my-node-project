"use client";

import { useState } from "react";
import { useAppStore, PubMedEntity } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FlaskConical, AlertTriangle, Search, X } from "lucide-react";

interface Props {
  studyId: string;
  text: string;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  drug:    { bg: "bg-violet-500/15", text: "text-violet-300", label: "Médicament" },
  disease: { bg: "bg-red-500/15",    text: "text-red-300",    label: "Maladie" },
  gene:    { bg: "bg-blue-500/15",   text: "text-blue-300",   label: "Gène/Protéine" },
  cell:    { bg: "bg-emerald-500/15",text: "text-emerald-300",label: "Cellule" },
  other:   { bg: "bg-neutral-700",   text: "text-neutral-400",label: "Autre" },
};

export function ExpertPanel({ studyId, text }: Props) {
  const { activeStudy, updateStudy, highlightKeyword, setHighlightKeyword } = useAppStore();
  const entities = activeStudy?.pubmedEntities;
  const status = activeStudy?.pubmedStatus ?? "idle";
  const [inputValue, setInputValue] = useState("");

  const run = async () => {
    updateStudy(studyId, { pubmedStatus: "loading" });
    try {
      const res = await fetch("/api/pubmed-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateStudy(studyId, { pubmedEntities: data.entities, pubmedStatus: "ready" });
    } catch (e: any) {
      updateStudy(studyId, { pubmedStatus: "error" });
    }
  };

  const grouped = entities?.reduce((acc, e) => {
    (acc[e.type] = acc[e.type] ?? []).push(e);
    return acc;
  }, {} as Record<string, PubMedEntity[]>);

  if (status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-full py-12 px-4 text-center">
        <FlaskConical className="w-10 h-10 text-violet-400 opacity-60" />
        <div>
          <p className="text-sm font-medium text-white mb-1">Mode Expert PubMedBERT</p>
          <p className="text-xs text-neutral-500">
            Extraction biomédicale par NER spécialisé PubMed.
            Identifie médicaments, maladies, gènes, protéines, biomarqueurs.
          </p>
        </div>
        <Button onClick={run} className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8">
          Lancer l'analyse PubMedBERT
        </Button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        <p className="text-xs text-neutral-400">Modèle HuggingFace en cours…</p>
        <p className="text-[11px] text-neutral-600">Extraction en cours (~3s)…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full px-4 text-center">
        <AlertTriangle className="w-7 h-7 text-amber-400" />
        <p className="text-xs text-neutral-400">Erreur ou modèle en cours de chargement</p>
        <Button size="sm" variant="outline" onClick={run} className="text-xs h-7">
          Réessayer
        </Button>
      </div>
    );
  }

  const applyKeyword = (kw: string) => {
    setHighlightKeyword(kw);
    setInputValue(kw);
  };

  const clearKeyword = () => {
    setHighlightKeyword("");
    setInputValue("");
  };

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
          {entities?.length} entités extraites
        </p>
        <Button size="sm" variant="ghost" onClick={run} className="h-6 text-[11px] text-neutral-500">
          Relancer
        </Button>
      </div>

      {/* Keyword search */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
          Surligner dans le PDF
        </p>
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyKeyword(inputValue)}
              placeholder="Mot-clé ou clic sur entité…"
              className="w-full h-7 pl-6 pr-2 text-[11px] bg-neutral-800 border border-neutral-700 rounded-md text-white placeholder:text-neutral-600 outline-none focus:border-violet-500"
            />
          </div>
          {highlightKeyword ? (
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={clearKeyword}>
              <X className="w-3 h-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] shrink-0 border-neutral-700"
              onClick={() => applyKeyword(inputValue)}
            >
              OK
            </Button>
          )}
        </div>
        {highlightKeyword && (
          <p className="text-[10px] text-amber-400">
            Surligné : « {highlightKeyword} » — navigue dans le PDF pour voir les occurrences
          </p>
        )}
      </div>

      {Object.entries(TYPE_COLORS).map(([type, style]) => {
        const group = grouped?.[type];
        if (!group?.length) return null;
        return (
          <div key={type}>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              {style.label} ({group.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.map((e, i) => {
                const isActive = highlightKeyword.toLowerCase() === e.text.toLowerCase();
                return (
                  <Badge
                    key={i}
                    onClick={() => isActive ? clearKeyword() : applyKeyword(e.text)}
                    className={`
                      ${style.bg} ${style.text} border-0 text-[11px] font-normal cursor-pointer
                      transition-all hover:opacity-80
                      ${isActive ? "ring-1 ring-amber-400 ring-offset-1 ring-offset-neutral-900" : ""}
                    `}
                  >
                    {e.text}
                    <span className="ml-1 opacity-50">{Math.round(e.score * 100)}%</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
