import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const MODELS = {
  text: "llama-3.3-70b-versatile",
  vision: "llama-3.2-11b-vision-preview",
} as const;

// Modèles supportant JSON mode — par ordre de qualité
const JSON_MODEL_CHAIN = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
];

// Fallback automatique sur 429 — compatible JSON mode uniquement
export async function groqWithFallback(
  params: Omit<Parameters<typeof groq.chat.completions.create>[0], "model" | "stream">
): Promise<Groq.Chat.ChatCompletion> {
  let lastError: any;

  for (const model of JSON_MODEL_CHAIN) {
    try {
      return await groq.chat.completions.create({
        ...params,
        model,
        stream: false,
      } as any);
    } catch (e: any) {
      const is429 = e?.status === 429 || e?.message?.includes("rate_limit_exceeded");
      if (is429) {
        console.warn(`[groq] Rate limit on ${model}, trying next…`);
        lastError = e;
        continue;
      }
      throw e;
    }
  }

  throw lastError ?? new Error("Tous les modèles Groq sont en limite de tokens. Réessaie dans quelques minutes.");
}
