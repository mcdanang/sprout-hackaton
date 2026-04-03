# AI-Powered Action Loop — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an AI layer that predicts team health risks from signal data, surfaces them as role-aware insight cards on the dashboard, and lets management act on concerns directly from those cards — plus a full AI Assistant page with chat.

**Architecture:** A `getAiInsights` server action queries Supabase signals, builds a context summary, and calls the OpenAI API to return structured predictions. Dashboard home renders role-aware insight cards (employee nudges vs management risk cards). AI Assistant page hosts full insight cards + a streaming chat route. Management can update `concern_status` via a new server action called from insight cards.

**Tech Stack:** Next.js 16 App Router, OpenAI SDK (`openai`), Supabase JS, Clerk, Tailwind CSS 4, shadcn/ui, next-intl

> **Note:** No test framework is configured. Skip TDD steps; instead verify manually via `npm run dev` and `npx tsc --noEmit` after each task.

---

## Success Metrics

| Metric                             | Target                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------- |
| AI insight cards load on dashboard | < 3s on first load                                                        |
| Role-aware content                 | Employee sees personal nudges; TOP MANAGEMENT sees project risk cards     |
| Predictions are data-backed        | Every insight references real DB data (count of signals, sentiment trend) |
| Management can act                 | `concern_status` changes from insight card without leaving the page       |
| Chat answers are grounded          | AI chat only answers using signals context passed in the prompt           |
| Achievements page renders          | Shows received appreciations/achievements with count                      |
| No TypeScript errors               | `npx tsc --noEmit` passes                                                 |

---

## Task 1: Install OpenAI SDK

**Files:**

- Modify: `package.json`

**Step 1: Install the SDK**

```bash
npm install openai
```

**Step 2: Add env variable**

Add to `.env.local`:

```
OPENAI_API_KEY=sk-...
```

**Step 3: Verify TypeScript sees it**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install openai sdk"
```

---

## Task 2: Create AI Client Utility

**Files:**

- Create: `src/lib/ai-client.ts`

**Step 1: Write the file**

```ts
// src/lib/ai-client.ts
import OpenAI from "openai";

// Singleton — reused across server actions in the same process.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/lib/ai-client.ts
git commit -m "feat: add OpenAI client singleton"
```

---

## Task 3: Create `getCurrentEmployeeWithRole` Utility

This is needed everywhere we need to know if the logged-in user is TOP MANAGEMENT.

**Files:**

- Create: `src/lib/get-current-employee.ts`

**Step 1: Write the file**

```ts
// src/lib/get-current-employee.ts
"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export type CurrentEmployee = {
  id: string;
  fullName: string;
  roleName: string;
  isTopManagement: boolean;
  projectIds: string[];
};

export async function getCurrentEmployee(): Promise<CurrentEmployee | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = await createClient();

  let { data: emp } = await supabase
    .from("employees")
    .select("id, full_name, role_id")
    .eq("auth_id", userId)
    .maybeSingle();

  if (!emp) {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (email) {
      const { data: byEmail } = await supabase
        .from("employees")
        .select("id, full_name, role_id")
        .eq("email", email)
        .maybeSingle();
      if (byEmail) emp = byEmail;
    }
  }

  if (!emp) return null;

  const [{ data: role }, { data: links }] = await Promise.all([
    supabase.from("roles").select("name").eq("id", emp.role_id).maybeSingle(),
    supabase
      .from("employee_projects")
      .select("project_id")
      .eq("employee_id", emp.id),
  ]);

  return {
    id: emp.id,
    fullName: emp.full_name,
    roleName: role?.name ?? "",
    isTopManagement: role?.name === "TOP MANAGEMENT",
    projectIds: (links ?? []).map((l) => l.project_id),
  };
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/lib/get-current-employee.ts
git commit -m "feat: add getCurrentEmployee utility with role detection"
```

---

## Task 4: Create `getAiInsights` Server Action

This is the core AI action. It queries DB signals, builds a prompt, calls Claude, and returns structured insights.

**Files:**

- Create: `src/app/actions/ai-insights.ts`

**Step 1: Write the action**

```ts
// src/app/actions/ai-insights.ts
"use server";

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

export async function getAiInsights(): Promise<AiInsightsResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { insights: [], generatedAt: new Date().toISOString() };

  const supabase = await createClient();

  // Fetch last 30 days of signals visible to this employee
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: signals } = await supabase
    .from("signals")
    .select(
      `
      id, category, ai_issue_category, sentiment_score, concern_status, created_at,
      project:projects(id, name)
    `,
    )
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

  // Build a text summary for Claude
  const summary = buildSignalSummary(signals, employee.isTopManagement);

  const systemPrompt = employee.isTopManagement
    ? `You are an HR analytics AI for a software company. Analyze team signals and return 3-5 actionable insight cards for top management. Focus on project health, burnout risk, and team morale trends. Be specific and data-backed. Return valid JSON only.`
    : `You are a personal work-wellbeing assistant. Analyze signals from the employee's team and return 2-3 personal nudge cards. Focus on encouragement, awareness of team mood, and gentle prompts to engage. Return valid JSON only.`;

  const userPrompt = `
Here is a summary of recent team signals (last 30 days):

${summary}

${
  employee.isTopManagement
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
}`
}

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
}

function buildSignalSummary(signals: any[], isManagement: boolean): string {
  // Group by project
  const byProject = new Map<string, { name: string; signals: any[] }>();
  const noProject: any[] = [];

  for (const s of signals) {
    const proj = s.project as { id: string; name: string } | null;
    if (proj?.id) {
      if (!byProject.has(proj.id))
        byProject.set(proj.id, { name: proj.name, signals: [] });
      byProject.get(proj.id)!.signals.push(s);
    } else {
      noProject.push(s);
    }
  }

  const lines: string[] = [];
  lines.push(`Total signals (last 30 days): ${signals.length}`);
  lines.push(
    `Concerns: ${signals.filter((s) => s.category === "concern").length}`,
  );
  lines.push(
    `Achievements: ${signals.filter((s) => s.category === "achievement").length}`,
  );
  lines.push(
    `Appreciations: ${signals.filter((s) => s.category === "appreciation").length}`,
  );
  lines.push("");

  for (const [, proj] of byProject) {
    const concerns = proj.signals.filter((s) => s.category === "concern");
    const avgSentiment =
      proj.signals
        .map((s) => s.sentiment_score ?? 50)
        .reduce((a, b) => a + b, 0) / proj.signals.length;

    const categories = proj.signals
      .map((s) => s.ai_issue_category)
      .filter(Boolean)
      .reduce((acc: Record<string, number>, cat: string) => {
        acc[cat] = (acc[cat] ?? 0) + 1;
        return acc;
      }, {});

    const openConcerns = concerns.filter(
      (s) => s.concern_status === "open",
    ).length;

    lines.push(`Project: ${proj.name}`);
    lines.push(`  Total signals: ${proj.signals.length}`);
    lines.push(`  Concerns: ${concerns.length} (${openConcerns} open)`);
    lines.push(`  Average sentiment: ${Math.round(avgSentiment)}/100`);
    lines.push(`  Issue breakdown: ${JSON.stringify(categories)}`);
    lines.push("");
  }

  return lines.join("\n");
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/app/actions/ai-insights.ts
git commit -m "feat: add getAiInsights server action with OpenAI integration"
```

---

## Task 5: Create AI Insight Cards Component

**Files:**

- Create: `src/components/dashboard/ai-insight-cards.tsx`

**Step 1: Write the component**

```tsx
// src/components/dashboard/ai-insight-cards.tsx
import { type AiInsightCard } from "@/app/actions/ai-insights";
import { cn } from "@/lib/utils";
import { Flash, WarningTriangle, CheckCircle, InfoCircle } from "iconoir-react";

const levelConfig = {
  critical: {
    bg: "bg-red-50 border-red-200",
    icon: WarningTriangle,
    iconColor: "text-red-500",
    badge: "bg-red-100 text-red-700",
    label: "Critical",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    icon: Flash,
    iconColor: "text-amber-500",
    badge: "bg-amber-100 text-amber-700",
    label: "Attention",
  },
  positive: {
    bg: "bg-green-50 border-green-200",
    icon: CheckCircle,
    iconColor: "text-green-500",
    badge: "bg-green-100 text-green-700",
    label: "Good",
  },
  nudge: {
    bg: "bg-blue-50 border-blue-200",
    icon: InfoCircle,
    iconColor: "text-blue-500",
    badge: "bg-blue-100 text-blue-700",
    label: "Insight",
  },
};

interface AiInsightCardsProps {
  insights: AiInsightCard[];
  generatedAt: string;
}

export function AiInsightCards({ insights, generatedAt }: AiInsightCardsProps) {
  if (!insights.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flash className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            AI Insights
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Updated{" "}
          {new Date(generatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((card, i) => {
          const cfg = levelConfig[card.level];
          const Icon = cfg.icon;

          return (
            <div
              key={i}
              className={cn(
                "rounded-2xl border p-5 space-y-3 transition-shadow hover:shadow-md",
                cfg.bg,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <Icon
                  className={cn("h-5 w-5 mt-0.5 shrink-0", cfg.iconColor)}
                />
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    cfg.badge,
                  )}
                >
                  {cfg.label}
                </span>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-sm text-foreground">
                  {card.title}
                </p>
                {card.projectName && (
                  <p className="text-xs text-muted-foreground font-medium">
                    {card.projectName}
                  </p>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.body}
                </p>
              </div>

              {card.actionLabel && (
                <button className="text-xs font-semibold text-red-600 hover:text-red-700 underline underline-offset-2">
                  {card.actionLabel} →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/dashboard/ai-insight-cards.tsx
git commit -m "feat: add AiInsightCards component"
```

---

## Task 6: Wire AI Insight Cards to Dashboard Home Page

**Files:**

- Modify: `src/app/[locale]/dashboard/page.tsx`

**Step 1: Convert page to async server component and add AI cards**

Replace the full content of `src/app/[locale]/dashboard/page.tsx`:

```tsx
// src/app/[locale]/dashboard/page.tsx
import { getTranslations } from "next-intl/server";
import { currentUser } from "@clerk/nextjs/server";
import { Quote } from "iconoir-react";
import { cn } from "@/lib/utils";
import { getAiInsights } from "@/app/actions/ai-insights";
import { AiInsightCards } from "@/components/dashboard/ai-insight-cards";

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard");
  const user = await currentUser();
  const firstName = user?.firstName || "there";

  const insights = await getAiInsights();

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="space-y-4">
        <p className="font-plus-jakarta text-[12px] font-semibold leading-[16px] tracking-[1.2px] uppercase text-[#B09100]">
          {t("title")}
        </p>
        <h1 className="font-plus-jakarta text-[48px] font-bold leading-[48px] tracking-[-1.2px] text-[#191C1D]">
          {t("welcome", { name: firstName })}
        </h1>
        <p className="font-plus-jakarta text-[18px] font-normal leading-[28px] text-[#3F484A] max-w-2xl">
          {t("subtitle")}
        </p>
      </div>

      {/* AI Insight Cards — role-aware, data from Claude */}
      <AiInsightCards
        insights={insights.insights}
        generatedAt={insights.generatedAt}
      />

      {/* AI Sanctuary Quote Card */}
      <div
        className={cn(
          "relative overflow-hidden rounded-[32px] p-10 md:p-14",
          "bg-[#FFFBEB] border border-[#FEF3C7] shadow-sm",
        )}
      >
        <Quote className="h-10 w-10 text-text-primary mb-8" />
        <div className="space-y-8">
          <p className="font-plus-jakarta text-[32px] md:text-[40px] font-medium leading-tight tracking-tight text-brand-primary">
            {t("quote.text")}
          </p>
          <Quote className="h-10 w-10 text-text-primary mb-8" />
          <div className="flex items-center gap-3">
            <div className="h-[2px] w-8 bg-primary" />
            <span className="font-plus-jakarta text-[14px] font-bold tracking-[1.5px] uppercase text-[#3F484A]">
              {t("quote.author")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

> **Note:** The page is now `async` and uses `getTranslations` (server-side) instead of `useTranslations` (client-side). Remove the `"use client"` directive — the file must not have it.

**Step 2: Run dev server and verify it renders**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard` and confirm AI cards appear.

**Step 3: Type-check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/app/[locale]/dashboard/page.tsx
git commit -m "feat: add role-aware AI insight cards to dashboard home"
```

---

## Task 7: Add `updateConcernStatus` Server Action

Management needs to act on concerns from insight cards.

**Files:**

- Modify: `src/app/actions/concerns.ts`

**Step 1: Add the action at the end of `src/app/actions/concerns.ts`**

```ts
export async function updateConcernStatus(
  signalId: string,
  status: "open" | "in_progress" | "closed",
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const employee = await resolveEmployeeId(supabase);
  if (!employee) return { ok: false, message: "Unauthorized" };

  const { error } = await supabase
    .from("signals")
    .update({ concern_status: status })
    .eq("id", signalId)
    .eq("category", "concern");

  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  return { ok: true, message: "Status updated." };
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/app/actions/concerns.ts
git commit -m "feat: add updateConcernStatus server action"
```

---

## Task 8: Build AI Assistant Page — Insight Cards + Chat

**Files:**

- Modify: `src/app/[locale]/dashboard/ai-assistant/page.tsx`
- Create: `src/app/api/ai-chat/route.ts`
- Create: `src/components/dashboard/ai-chat.tsx`

### Step 1: Create the streaming chat API route

```ts
// src/app/api/ai-chat/route.ts
import { openai } from "@/lib/ai-client";

export async function POST(req: Request) {
  const { message, context } = (await req.json()) as {
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
```

### Step 2: Create AI Chat client component

```tsx
// src/components/dashboard/ai-chat.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Flash } from "iconoir-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiChatProps {
  context: string; // pre-built signal summary passed from server
}

export function AiChat({ context }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    const res = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed, context }),
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value, { stream: true });
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: accumulated,
        };
        return updated;
      });
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col h-[480px] rounded-2xl border bg-background overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <Flash className="h-10 w-10 text-amber-400" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Ask me anything about your team's signals. e.g. "Which project has
              the most burnout risk?"
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              m.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-muted text-foreground",
            )}
          >
            {m.content || <span className="animate-pulse">...</span>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <input
          className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Ask about your team..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

### Step 3: Rebuild AI Assistant page

Replace `src/app/[locale]/dashboard/ai-assistant/page.tsx`:

```tsx
// src/app/[locale]/dashboard/ai-assistant/page.tsx
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
    .select(
      "category, ai_issue_category, sentiment_score, concern_status, project:projects(name)",
    )
    .gte("created_at", since)
    .limit(100);

  if (!signals?.length) return "No signals in the last 30 days.";

  const lines = [
    `Role: ${employee.isTopManagement ? "Top Management" : "Employee"}`,
    `Signals last 30 days: ${signals.length}`,
    `Concerns: ${signals.filter((s) => s.category === "concern").length}`,
    `Avg sentiment: ${Math.round(signals.reduce((a, s) => a + (s.sentiment_score ?? 50), 0) / signals.length)}/100`,
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
          <span className="text-sm font-medium uppercase tracking-wider">
            AI Assistant
          </span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">AI Assistant</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Smart insights and predictions based on your team's signals.
        </p>
      </section>

      {/* Full insight cards */}
      <AiInsightCards
        insights={insightsResult.insights}
        generatedAt={insightsResult.generatedAt}
      />

      {/* Chat */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Ask Signal AI</h2>
        <AiChat context={chatContext} />
      </section>
    </div>
  );
}
```

**Step 4: Type-check and dev server**

```bash
npx tsc --noEmit
npm run dev
```

Open `http://localhost:3000/dashboard/ai-assistant`. Verify insights load and chat works.

**Step 5: Commit**

```bash
git add src/app/api/ai-chat/route.ts src/components/dashboard/ai-chat.tsx src/app/[locale]/dashboard/ai-assistant/page.tsx
git commit -m "feat: build AI assistant page with insight cards and streaming chat"
```

---

## Task 9: Build Achievements Page

Shows appreciation and achievement signals received by the current employee.

**Files:**

- Create: `src/app/actions/achievements.ts`
- Modify: `src/app/[locale]/dashboard/achievements/page.tsx`

### Step 1: Create achievements server action

```ts
// src/app/actions/achievements.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/get-current-employee";

export type AchievementItem = {
  id: string;
  category: "achievement" | "appreciation";
  title: string;
  details: string;
  createdAt: string;
  isAnonymous: boolean;
  authorName: string;
  projectName: string | null;
};

export async function getMyAchievements(): Promise<AchievementItem[]> {
  const employee = await getCurrentEmployee();
  if (!employee) return [];

  const supabase = await createClient();

  // Find signals targeting this employee that are achievement/appreciation
  const { data: targets } = await supabase
    .from("signal_targets")
    .select("signal_id")
    .eq("target_type", "employee")
    .eq("target_employee_id", employee.id);

  const signalIds = (targets ?? []).map((t) => t.signal_id);

  if (!signalIds.length) return [];

  const { data: signals } = await supabase
    .from("signals")
    .select(
      `
      id, category, title, details, created_at, is_anonymous,
      author:employees!author_employee_id(full_name),
      project:projects(name)
    `,
    )
    .in("id", signalIds)
    .in("category", ["achievement", "appreciation"])
    .order("created_at", { ascending: false });

  return (signals ?? []).map((s) => ({
    id: s.id,
    category: s.category as "achievement" | "appreciation",
    title: s.title,
    details: s.details,
    createdAt: new Date(s.created_at).toISOString(),
    isAnonymous: Boolean(s.is_anonymous),
    authorName: s.is_anonymous
      ? "Anonymous"
      : ((s.author as any)?.full_name ?? "Unknown"),
    projectName: (s.project as any)?.name ?? null,
  }));
}
```

### Step 2: Rebuild Achievements page

Replace `src/app/[locale]/dashboard/achievements/page.tsx`:

```tsx
// src/app/[locale]/dashboard/achievements/page.tsx
import { Star, Medal } from "iconoir-react";
import { getMyAchievements } from "@/app/actions/achievements";
import { cn } from "@/lib/utils";

const categoryConfig = {
  achievement: {
    label: "Achievement",
    color: "bg-amber-100 text-amber-700",
    icon: Medal,
  },
  appreciation: {
    label: "Appreciation",
    color: "bg-purple-100 text-purple-700",
    icon: Star,
  },
};

export default async function AchievementsPage() {
  const achievements = await getMyAchievements();

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Star className="h-4 w-4" />
          <span className="text-sm font-medium uppercase tracking-wider">
            My Achievements
          </span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">
          My Achievements
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Recognitions and appreciation signals you have received from your
          peers.
        </p>
      </section>

      {achievements.length === 0 ? (
        <div className="rounded-xl border border-dashed p-20 flex flex-col items-center justify-center text-center bg-background/50">
          <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            No achievements yet
          </h3>
          <p className="text-sm text-muted-foreground/60 max-w-xs">
            When teammates recognize your work, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {achievements.length} recognition
            {achievements.length !== 1 ? "s" : ""} received
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((item) => {
              const cfg = categoryConfig[item.category];
              const Icon = cfg.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-background p-5 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Icon className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        cfg.color,
                      )}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.details}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>From: {item.authorName}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  {item.projectName && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {item.projectName}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Type-check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/app/actions/achievements.ts src/app/[locale]/dashboard/achievements/page.tsx
git commit -m "feat: build achievements page with received recognitions"
```

---

## Task 10: Final Polish & Loading States

**Files:**

- Create: `src/app/[locale]/dashboard/loading.tsx` (optional Suspense fallback)

**Step 1: Add a simple loading skeleton for dashboard pages**

```tsx
// src/app/[locale]/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-12 w-96 bg-muted rounded" />
        <div className="h-5 w-64 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border p-5 h-32 bg-muted" />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Type-check and final build check**

```bash
npx tsc --noEmit
npm run build
```

Resolve any build errors before proceeding.

**Step 3: Final commit**

```bash
git add src/app/[locale]/dashboard/loading.tsx
git commit -m "feat: add loading skeleton for dashboard pages"
```

---

## Verification Checklist

Before demo day, verify each item manually:

- [ ] Employee login: dashboard shows personal AI nudge cards
- [ ] TOP MANAGEMENT login: dashboard shows project risk cards with severity levels
- [ ] AI cards are data-backed (reference real signal counts/sentiment)
- [ ] AI Assistant page loads full insight cards + chat box
- [ ] Chat streams response token by token
- [ ] Chat answers are grounded in signal data (not hallucinated)
- [ ] Achievements page shows received recognitions (or empty state)
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` succeeds

---

## Day-by-Day Schedule (5 days)

| Day   | Tasks      | Outcome                                         |
| ----- | ---------- | ----------------------------------------------- |
| Day 1 | Tasks 1–3  | SDK installed, AI client, role utility          |
| Day 2 | Tasks 4–5  | `getAiInsights` action + cards component        |
| Day 3 | Task 6     | AI cards live on dashboard home (demo-able)     |
| Day 4 | Tasks 7–8  | AI Assistant page fully working with chat       |
| Day 5 | Tasks 9–10 | Achievements page + polish + build verification |
