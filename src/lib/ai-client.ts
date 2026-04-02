// src/lib/ai-client.ts
import OpenAI from "openai";

// Singleton — reused across server actions in the same process.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
