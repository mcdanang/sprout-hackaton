import { openai } from "@/lib/ai-client";
import { SIGNAL_ISSUE_CATEGORIES } from "@/lib/signal-ai";

export async function POST(req: Request) {
  const { text, category } = (await req.json()) as { text: string; category: string };

  if (!text || text.trim().length < 10) {
    return Response.json({ issueCategory: null, sentiment: null });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 80,
      messages: [
        {
          role: "system",
          content: `You are a workplace signal classifier. Given a signal text, return JSON with exactly two fields:
- "issueCategory": one of ${JSON.stringify(SIGNAL_ISSUE_CATEGORIES)}
- "sentiment": integer 0–100 (0 = very negative, 100 = very positive)

Return ONLY valid JSON, no explanation.`,
        },
        {
          role: "user",
          content: `Signal type: ${category}\nText: ${text}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    return Response.json({
      issueCategory: SIGNAL_ISSUE_CATEGORIES.includes(parsed.issueCategory)
        ? parsed.issueCategory
        : "others",
      sentiment: typeof parsed.sentiment === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.sentiment)))
        : null,
    });
  } catch {
    return Response.json({ issueCategory: null, sentiment: null });
  }
}
