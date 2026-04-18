"use client";

import { useState } from "react";
import { StudyAnalysis } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface Props {
  study: StudyAnalysis;
}

export function ExportPDF({ study }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const margin = 20;
      const pageW = doc.internal.pageSize.getWidth();
      const contentW = pageW - margin * 2;
      let y = margin;

      const addText = (
        text: string,
        size: number,
        color: [number, number, number] = [30, 30, 30],
        bold = false
      ) => {
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, contentW);
        lines.forEach((line: string) => {
          if (y > 270) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += size * 0.45;
        });
        y += 4;
      };

      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, pageW, 12, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("AuraDoc — Rapport d'analyse", margin, 8);
      y = 22;

      addText(study.fileName.replace(".pdf", ""), 18, [20, 20, 20], true);
      addText(
        `Généré le ${new Date().toLocaleDateString("fr-FR")}`,
        9,
        [120, 120, 120]
      );
      y += 4;

      if (study.pitch) {
        addText("PITCH DE L'ÉTUDE", 11, [124, 58, 237], true);
        addText(study.pitch, 10);
        y += 4;
      }

      if (study.keyTakeaways?.length) {
        addText("KEY TAKEAWAYS", 11, [16, 185, 129], true);
        study.keyTakeaways.forEach((kta, i) => {
          addText(`${i + 1}. ${kta}`, 10);
        });
        y += 4;
      }

      if (study.entities?.length) {
        addText("ENTITÉS CLÉS DÉTECTÉES", 11, [59, 130, 246], true);
        const entityText = study.entities.map((e) => e.label).join("  ·  ");
        addText(entityText, 10, [70, 70, 70]);
      }

      doc.save(`AuraDoc_${study.fileName.replace(".pdf", "")}_rapport.pdf`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 text-xs border-violet-700 text-violet-400 hover:bg-violet-500/10"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
      ) : (
        <Download className="w-3 h-3 mr-1" />
      )}
      Exporter PDF
    </Button>
  );
}
