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
    <div className="max-w-6xl mx-auto flex flex-col gap-10 pb-10">
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 text-brand font-bold">
          <div className="p-1.5 rounded-lg bg-brand/10">
            <Flash className="h-5 w-5" />
          </div>
          <span className="text-sm uppercase tracking-[0.2em]">Intelligence</span>
        </div>
        <h1 className="text-5xl font-black tracking-tight text-brand-primary">AI Assistant</h1>
        <p className="max-w-2xl text-xl text-muted-foreground leading-relaxed">
          Predictive insights and real-time analysis powered by Signal AI.
        </p>
      </section>

      <AiInsightCards insights={insightsResult.insights} generatedAt={insightsResult.generatedAt} />

      <section className="grid grid-cols-1 gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-brand-primary tracking-tight">Ask Intelligence</h2>
          <div className="px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-[10px] font-bold text-brand uppercase tracking-wider">
            Experimental
          </div>
        </div>
        <AiChat context={chatContext} />
      </section>
    </div>
  );
}
