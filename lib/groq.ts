import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const MODELS = {
  text: "llama-3.3-70b-versatile",
  vision: "llama-3.2-11b-vision-preview",
} as const;
