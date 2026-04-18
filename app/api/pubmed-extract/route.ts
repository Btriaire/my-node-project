import { NextRequest, NextResponse } from "next/server";

const HF_MODEL = "d4data/biomedical-ner-all";
const HF_API = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

interface HFEntity {
  entity_group: string;
  score: number;
  word: string;
  start: number;
  end: number;
}

const TYPE_MAP: Record<string, string> = {
  DISEASE: "disease",
  CHEMICAL: "drug",
  DRUG: "drug",
  GENE: "gene",
  "GENE/PROTEIN": "gene",
  PROTEIN: "gene",
  "CELL-LINE": "cell",
  "CELL-TYPE": "cell",
  DNA: "gene",
  RNA: "gene",
};

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

    // HF NER works best on short chunks — split into 512-token chunks
    const chunks = splitIntoChunks(text, 400);
    const allEntities: HFEntity[] = [];

    for (const chunk of chunks.slice(0, 6)) {
      const res = await fetch(HF_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: chunk, parameters: { aggregation_strategy: "simple" } }),
      });

      if (!res.ok) {
        const err = await res.text();
        if (res.status === 503) {
          return NextResponse.json({ error: "Modèle HF en cours de chargement (30s), réessaie." }, { status: 503 });
        }
        throw new Error(`HF API error: ${err}`);
      }

      const data: HFEntity[] = await res.json();
      if (Array.isArray(data)) allEntities.push(...data);
    }

    // Deduplicate and map types
    const seen = new Set<string>();
    const entities = allEntities
      .filter((e) => e.score > 0.75)
      .map((e) => ({
        text: e.word.replace(/^##/, "").trim(),
        type: TYPE_MAP[e.entity_group?.toUpperCase()] ?? "other",
        score: Math.round(e.score * 100) / 100,
      }))
      .filter((e) => {
        if (e.text.length < 2 || seen.has(e.text.toLowerCase())) return false;
        seen.add(e.text.toLowerCase());
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 60);

    return NextResponse.json({ entities });
  } catch (e: any) {
    console.error("PubMed extract error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function splitIntoChunks(text: string, wordsPerChunk: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks;
}
