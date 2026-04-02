import { Flash } from "iconoir-react";
import { useTranslations } from "next-intl";

export default function AiAssistantPage() {
  const t = useTranslations("Dashboard.nav");

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Flash className="h-4 w-4" />
          <span className="text-sm font-medium uppercase tracking-wider">{t("aiAssistant")}</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">
          {t("aiAssistant")}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Get smart insights and assistance for managing ownership signals.
        </p>
      </section>
      
      <div className="rounded-xl border border-dashed p-20 flex flex-col items-center justify-center text-center bg-background/50">
        <Flash className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground">AI is sleeping</h3>
        <p className="text-sm text-muted-foreground/60 max-w-xs">
          This AI assistant is currently a placeholder and will be online soon.
        </p>
      </div>
    </div>
  );
}
