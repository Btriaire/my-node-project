"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";
import { Sidebar } from "@/components/layout/Sidebar";
import { InsightPanel } from "@/components/insights/InsightPanel";
import { Upload, Activity } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const PDFViewer = dynamic(
  () => import("@/components/pdf/PDFViewer").then((m) => m.PDFViewer),
  { ssr: false, loading: () => <div className="flex-1 bg-neutral-900" /> }
);

export default function Home() {
  const { activeStudy, addStudy, updateStudy, setActiveStudy } = useAppStore();
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont acceptés.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    const tempId = crypto.randomUUID();

    const newStudy = {
      id: tempId,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      storageUrl: localUrl,
      extractedText: "",
      status: "analyzing" as const,
    };

    addStudy(newStudy);
    setActiveStudy(newStudy);
    toast.info("Extraction du texte en cours...");

    try {
      // Étape 1 : extraction serveur (pdf-parse, zéro worker browser)
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error ?? "Extraction échouée");
      }

      const { text } = await uploadRes.json();
      updateStudy(tempId, { extractedText: text });

      toast.info("Analyse IA en cours (Groq)...");

      // Étape 2 : analyse Groq
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, studyId: tempId }),
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error ?? "Analyse échouée");
      }

      const data = await analyzeRes.json();

      updateStudy(tempId, {
        status: "ready",
        pitch: data.pitch,
        keyTakeaways: data.keyTakeaways,
        limitations: data.limitations,
        entities: data.entities,
      });

      toast.success("Analyse terminée !");
    } catch (e: any) {
      updateStudy(tempId, { status: "error" });
      toast.error("Erreur : " + e.message);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden relative">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {!activeStudy ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-violet-400" />
              <h1 className="text-3xl font-bold tracking-tight">AuraDoc</h1>
            </div>
            <p className="text-neutral-400 text-sm max-w-sm text-center">
              Dépose un PDF d'étude clinique pour générer un résumé IA, extraire
              les points clés et visualiser les entités.
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`
                w-full max-w-md border-2 border-dashed rounded-xl p-12
                flex flex-col items-center gap-4 transition-colors
                ${dragging ? "border-violet-400 bg-violet-500/10" : "border-neutral-700"}
              `}
            >
              <Upload className={`w-10 h-10 ${dragging ? "text-violet-400" : "text-neutral-600"}`} />
              <div className="text-center">
                <p className="text-sm text-neutral-300">Glisse ton PDF ici ou</p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-sm text-violet-400 underline hover:text-violet-300 mt-1"
                >
                  parcourir les fichiers
                </button>
                <p className="text-xs text-neutral-600 mt-2">PDF uniquement · max 50 Mo</p>
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <PDFViewer url={activeStudy.storageUrl} />
            </div>
            <div className="w-80 shrink-0 border-l border-neutral-800 overflow-hidden">
              <InsightPanel study={activeStudy} />
            </div>
          </div>
        )}
      </main>

      <Toaster theme="dark" />
    </div>
  );
}
