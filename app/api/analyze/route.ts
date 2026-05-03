import { NextRequest, NextResponse } from "next/server";
import { groqWithFallback } from "@/lib/groq";

const PERSONA = `Tu es un Senior Clinical Scientist avec 15 ans d'expérience en oncologie, biostatistiques et médecine translationnelle. Tu analyses des publications scientifiques avec rigueur, esprit critique et précision. Tu identifies systématiquement les forces et les limites méthodologiques sans qu'on te le demande.`;

export async function POST(req: NextRequest) {
  try {
    const { text, studyId } = await req.json();
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

    const truncated = text.slice(0, 12000);

    const [pitchRes, ktaRes, limitationsRes, entitiesRes] = await Promise.all([
      groqWithFallback({
        
        messages: [
          { role: "system", content: `${PERSONA} Génère un résumé "Pitch" de 3-4 phrases de cette étude, destiné à un directeur médical non-statisticien. Sois précis sur le design, la population et le résultat principal.` },
          { role: "user", content: truncated },
        ],
        max_tokens: 350,
      }),
      groqWithFallback({
        
        messages: [
          { role: "system", content: `${PERSONA} Extrais exactement 5 Key Takeaways critiques de cette étude. Inclus les chiffres clés (p-values, HR, CI, N). Réponds en JSON: {"takeaways": ["...", ...]}` },
          { role: "user", content: truncated },
        ],
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
      groqWithFallback({
        
        messages: [
          { role: "system", content: `${PERSONA} Identifie 3 à 5 limites méthodologiques critiques de cette étude (p-values borderline, faible puissance statistique, biais de sélection, conflits d'intérêts, financement industriel, généralisation limitée, etc.). Sois direct et factuel. Réponds en JSON: {"limitations": ["...", ...]}` },
          { role: "user", content: truncated },
        ],
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
      groqWithFallback({
        
        messages: [
          { role: "system", content: `${PERSONA} Extrais les entités clés pour un graphe relationnel : molécules, cibles biologiques, maladies, endpoints, populations. Réponds en JSON: {"entities": [{"id": "e1", "label": "...", "type": "drug|target|disease|endpoint|population", "links": ["e2"]}]}` },
          { role: "user", content: truncated },
        ],
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
    ]);

    const pitch = pitchRes.choices[0].message.content ?? "";
    const kta = JSON.parse(ktaRes.choices[0].message.content ?? "{}");
    const lim = JSON.parse(limitationsRes.choices[0].message.content ?? "{}");
    const ent = JSON.parse(entitiesRes.choices[0].message.content ?? "{}");

    return NextResponse.json({
      studyId,
      pitch,
      keyTakeaways: kta.takeaways ?? [],
      limitations: lim.limitations ?? [],
      entities: ent.entities ?? [],
    });
  } catch (e: any) {
    console.error("Analyze error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
