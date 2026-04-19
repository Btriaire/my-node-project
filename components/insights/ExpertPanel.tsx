"use client";

import { useState } from "react";
import { useAppStore, PubMedEntity } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FlaskConical, AlertTriangle } from "lucide-react";

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
  const { activeStudy, updateStudy } = useAppStore();
  const entities = activeStudy?.pubmedEntities;
  const status = activeStudy?.pubmedStatus ?? "idle";

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

      {Object.entries(TYPE_COLORS).map(([type, style]) => {
        const group = grouped?.[type];
        if (!group?.length) return null;
        return (
          <div key={type}>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              {style.label} ({group.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.map((e, i) => (
                <Badge key={i} className={`${style.bg} ${style.text} border-0 text-[11px] font-normal`}>
                  {e.text}
                  <span className="ml-1 opacity-50">{Math.round(e.score * 100)}%</span>
                </Badge>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
