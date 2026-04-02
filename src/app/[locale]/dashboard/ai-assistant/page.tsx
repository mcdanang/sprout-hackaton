import { Flash } from "iconoir-react";
import { getAiInsights } from "@/app/actions/ai-insights";
import { AiInsightCards } from "@/components/dashboard/ai-insight-cards";
import { AiChat } from "@/components/dashboard/ai-chat";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/get-current-employee";

async function buildChatContext(): Promise<string> {
  const employee = await getCurrentEmployee();
  if (!employee) return "No data available.";

  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: signals } = await supabase
    .from("signals")
    .select("category, ai_issue_category, sentiment_score, concern_status, project:projects(name)")
    .gte("created_at", since)
    .limit(100);

  if (!signals?.length) return "No signals in the last 30 days.";

  const lines = [
    `Role: ${employee.isTopManagement ? "Top Management" : "Employee"}`,
    `Signals last 30 days: ${signals.length}`,
    `Concerns: ${signals.filter(s => s.category === "concern").length}`,
    `Avg sentiment: ${Math.round(signals.reduce((a, s) => a + ((s.sentiment_score as number) ?? 50), 0) / signals.length)}/100`,
  ];

  return lines.join("\n");
}

export default async function AiAssistantPage() {
  const [insightsResult, chatContext] = await Promise.all([
    getAiInsights(),
    buildChatContext(),
  ]);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Flash className="h-4 w-4" />
          <span className="text-sm font-medium uppercase tracking-wider">AI Assistant</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">AI Assistant</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Smart insights and predictions based on your team&apos;s signals.
        </p>
      </section>

      <AiInsightCards insights={insightsResult.insights} generatedAt={insightsResult.generatedAt} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Ask Sprout AI</h2>
        <AiChat context={chatContext} />
      </section>
    </div>
  );
}
