// src/components/dashboard/ai-insight-cards.tsx
import { type AiInsightCard } from "@/app/actions/ai-insights";
import { FormattedContent } from "@/components/shared/formatted-content";
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
          Updated {new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                cfg.bg
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", cfg.iconColor)} />
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cfg.badge)}>
                  {cfg.label}
                </span>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-sm text-foreground">{card.title}</p>
                {card.projectName && (
                  <p className="text-xs text-muted-foreground font-medium">{card.projectName}</p>
                )}
                <FormattedContent
                  content={card.body}
                  className="text-sm text-muted-foreground leading-relaxed"
                />
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
