import { NextRequest, NextResponse } from "next/server";
import { groqWithFallback } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

    const truncated = text.slice(0, 10000);

    const res = await groqWithFallback({
      messages: [
        {
          role: "system",
          content: `Tu es un extracteur biomédical expert entraîné sur PubMed. Analyse ce texte scientifique et extrais TOUTES les entités biomédicales avec leur type et un score de confiance.

Types d'entités :
- drug : médicaments, molécules, traitements (ex: pembrolizumab, aspirine, chimiothérapie)
- disease : maladies, pathologies, syndromes (ex: NSCLC, cancer du poumon, diabète)
- gene : gènes, protéines, biomarqueurs (ex: KRAS, PD-L1, EGFR, HER2)
- cell : types cellulaires, lignées (ex: cellules T, NK cells)
- other : p-values, endpoints, populations, institutions

Réponds UNIQUEMENT en JSON :
{
  "entities": [
    {"text": "pembrolizumab", "type": "drug", "score": 0.99},
    {"text": "NSCLC", "type": "disease", "score": 0.98}
  ]
}

Extrais un maximum d'entités pertinentes (40-60 minimum). Ne répète pas les doublons.`,
        },
        { role: "user", content: truncated },
      ],
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(res.choices[0].message.content ?? "{}");
    const seen = new Set<string>();
    const entities = (parsed.entities ?? [])
      .filter((e: any) => {
        const key = e.text?.toLowerCase();
        if (!key || key.length < 2 || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 80);

    return NextResponse.json({ entities });
  } catch (e: any) {
    console.error("Expert extract error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
