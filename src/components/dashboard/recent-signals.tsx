import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { History } from "lucide-react";

export async function RecentSignals() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ownership_signals")
    .select("id, type, title, created_at, is_anonymous")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Recent Signals
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Error loading signals: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-muted-foreground" />
          Recent Signals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <p className="text-sm">No signals yet. Submit your first one!</p>
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={item.type === "recognition" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {item.type}
                  </Badge>
                  {item.is_anonymous && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      Anonymous
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
