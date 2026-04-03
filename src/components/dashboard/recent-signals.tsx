import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { FormattedContent } from "@/components/shared/formatted-content";
import { History } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function RecentSignals() {
  const t = await getTranslations("Recent");
  const commonT = await getTranslations("Common");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("signals")
    .select("id, category, title, created_at, is_anonymous")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <History className="h-5 w-5 text-destructive" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm font-medium text-destructive">
          Error loading signals: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-muted/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <History className="h-5 w-5 text-muted-foreground" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <p className="text-sm font-medium px-4">{t("empty")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-muted/50 p-4 transition-all hover:bg-muted/30 hover:border-muted-foreground/20"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.category === "appreciation" ? "default" : "secondary"}
                      className="text-[10px] font-bold uppercase tracking-wider px-2"
                    >
                      {item.category === "concern"
                        ? "Concern"
                        : item.category === "achievement"
                          ? "Achievement"
                          : "Appreciation"}
                    </Badge>
                    {item.is_anonymous && (
                      <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider bg-background/50">
                        {commonT("anonymous")}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                    {new Date(item.created_at).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <FormattedContent
                  content={item.title}
                  className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-primary transition-colors"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
