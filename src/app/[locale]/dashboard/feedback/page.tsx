import { ShieldCheck } from "iconoir-react";
import { useTranslations } from "next-intl";

export default function FeedbackPage() {
  const t = useTranslations("Dashboard.nav");

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-sm font-medium uppercase tracking-wider">{t("privateFeedback")}</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">
          {t("privateFeedback")}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Your secure channel for private communication regarding ownership and workplace signals.
        </p>
      </section>
      
      <div className="rounded-xl border border-dashed p-20 flex flex-col items-center justify-center text-center bg-background/50">
        <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground">Empty Inbox</h3>
        <p className="text-sm text-muted-foreground/60 max-w-xs">
          This page is currently a placeholder and will be functional soon.
        </p>
      </div>
    </div>
  );
}
