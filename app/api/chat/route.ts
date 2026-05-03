import { NextRequest } from "next/server";
import { groq, MODELS } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json();

  const stream = await groq.chat.completions.create({
    model: MODELS.text,
    stream: true,
    max_tokens: 800,
    messages: [
      {
        role: "system",
        content: `Tu es un Senior Clinical Scientist avec 15 ans d'expérience en oncologie, biostatistiques et médecine de précision. Tu analyses le document scientifique suivant et réponds aux questions avec rigueur, précision et esprit critique.

DOCUMENT :
${context.slice(0, 10000)}

RÈGLES :
- Réponds uniquement sur la base du document fourni
- Cite les données chiffrées (p-values, HR, CI, N) quand pertinent
- Si la question dépasse le contenu du document, dis-le clairement
- Identifie proactivement les limites méthodologiques si pertinent
- Ton formel, scientifique, concis`,
      },
      ...messages,
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) controller.enqueue(encoder.encode(delta));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
