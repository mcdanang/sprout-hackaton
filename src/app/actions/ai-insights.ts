// src/app/actions/ai-insights.ts
"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/ai-client";
import { getCurrentEmployee } from "@/lib/get-current-employee";

export type AiInsightCard = {
  level: "critical" | "warning" | "positive" | "nudge";
  title: string;
  body: string;
  projectName?: string;
  actionLabel?: string;
  actionProjectId?: string;
};

export type AiInsightsResult = {
  insights: AiInsightCard[];
  generatedAt: string;
};

// Only the OpenAI call is cached — no cookies/DB access inside.
// Cache key = summary content + isTopManagement. Revalidates every hour.
const callOpenAiForInsights = unstable_cache(
  async (summary: string, isTopManagement: boolean): Promise<AiInsightsResult> => {
    const systemPrompt = isTopManagement
      ? `You are an HR analytics AI for a software company. Analyze team signals and return 3-5 actionable insight cards for top management. Focus on project health, burnout risk, and team morale trends. Be specific and data-backed. Return valid JSON only.`
      : `You are a personal work-wellbeing assistant. Analyze signals from the employee's team and return 2-3 personal nudge cards. Focus on encouragement, awareness of team mood, and gentle prompts to engage. Return valid JSON only.`;

    const userPrompt = `
Here is a summary of recent team signals (last 30 days):

${summary}

${isTopManagement
  ? `Return a JSON array of 3-5 insight cards. Each card:
{
  "level": "critical" | "warning" | "positive",
  "title": "short title (max 8 words)",
  "body": "1-2 sentence insight with specific data from the summary",
  "projectName": "project name if relevant, else omit",
  "actionLabel": "short CTA like 'Address Now' if critical, else omit",
  "actionProjectId": "project id if actionLabel present, else omit"
}`
  : `Return a JSON array of 2-3 nudge cards. Each card:
{
  "level": "nudge" | "positive",
  "title": "short friendly title (max 8 words)",
  "body": "1-2 sentence personal insight or encouragement"
}`}

Respond with ONLY the JSON array, no markdown, no explanation.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 800,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const text = response.choices[0]?.message?.content ?? "[]";
      const parsed = JSON.parse(text) as AiInsightCard[];

      return {
        insights: Array.isArray(parsed) ? parsed : [],
        generatedAt: new Date().toISOString(),
      };
    } catch {
      return {
        insights: [
          {
            level: "nudge",
            title: "AI insights unavailable",
            body: "Could not generate insights right now. Try again later.",
          },
        ],
        generatedAt: new Date().toISOString(),
      };
    }
  },
  ["ai-insights"],
  { revalidate: 3600 },
);

// DB query runs every time (needs cookies via createClient).
// OpenAI is only called when summary changes or cache expires.
export async function getAiInsights(): Promise<AiInsightsResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { insights: [], generatedAt: new Date().toISOString() };

  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: signals } = await supabase
    .from("signals")
    .select(`
      id, category, ai_issue_category, sentiment_score, concern_status, created_at,
      project:projects(id, name)
    `)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!signals?.length) {
    return {
      insights: [
        {
          level: "nudge",
          title: "No signals yet",
          body: "No signals have been submitted in the last 30 days. Encourage your team to share.",
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  const summary = buildSignalSummary(signals);
  return callOpenAiForInsights(summary, employee.isTopManagement);
}

function buildSignalSummary(signals: any[]): string {
  const byProject = new Map<string, { name: string; signals: any[] }>();

  for (const s of signals) {
    const proj = s.project as { id: string; name: string } | null;
    if (proj?.id) {
      if (!byProject.has(proj.id)) byProject.set(proj.id, { name: proj.name, signals: [] });
      byProject.get(proj.id)!.signals.push(s);
    }
  }

  const lines: string[] = [];
  lines.push(`Total signals (last 30 days): ${signals.length}`);
  lines.push(`Concerns: ${signals.filter(s => s.category === "concern").length}`);
  lines.push(`Achievements: ${signals.filter(s => s.category === "achievement").length}`);
  lines.push(`Appreciations: ${signals.filter(s => s.category === "appreciation").length}`);
  lines.push("");

  for (const [, proj] of byProject) {
    const concerns = proj.signals.filter((s: any) => s.category === "concern");
    const avgSentiment =
      proj.signals.map((s: any) => s.sentiment_score ?? 50).reduce((a: number, b: number) => a + b, 0) /
      proj.signals.length;

    const categories = proj.signals
      .map((s: any) => s.ai_issue_category)
      .filter(Boolean)
      .reduce((acc: Record<string, number>, cat: string) => {
        acc[cat] = (acc[cat] ?? 0) + 1;
        return acc;
      }, {});

    const openConcerns = concerns.filter((s: any) => s.concern_status === "open").length;

    lines.push(`Project: ${proj.name}`);
    lines.push(`  Total signals: ${proj.signals.length}`);
    lines.push(`  Concerns: ${concerns.length} (${openConcerns} open)`);
    lines.push(`  Average sentiment: ${Math.round(avgSentiment)}/100`);
    lines.push(`  Issue breakdown: ${JSON.stringify(categories)}`);
    lines.push("");
  }

  return lines.join("\n");
}
