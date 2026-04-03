import { openai } from "@/lib/ai-client";

export async function POST(req: Request) {
  const { message, context } = await req.json() as {
    message: string;
    context: string;
  };

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 600,
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are Signal AI, a team health assistant. Answer questions using ONLY the signal data context provided. Be concise and actionable. Context:\n\n${context}`,
      },
      { role: "user", content: message },
    ],
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
