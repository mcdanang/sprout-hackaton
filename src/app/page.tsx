import { OwnershipSignalForm } from "@/components/ownership-signal-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

async function RecentSignals() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ownership_signals")
    .select("id, type, title, created_at, is_anonymous")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Signals</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Configure Supabase schema to load signals. Error: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Signals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No signals yet. Submit the first concern or recognition.
          </p>
        ) : (
          data.map((item) => (
            <div key={item.id} className="rounded-md border p-3">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={item.type === "recognition" ? "default" : "secondary"}>
                  {item.type}
                </Badge>
                {item.is_anonymous ? (
                  <Badge variant="outline">anonymous</Badge>
                ) : null}
              </div>
              <p className="font-medium">{item.title}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <section className="space-y-3">
        <Badge>Hackathon Starter</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Ownership Platform - Speak Up and Recognize
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Safe channel for employees to raise concerns early and acknowledge peers
          who show ownership, so teams improve transparency, trust, and
          accountability.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <OwnershipSignalForm />
        <RecentSignals />
      </section>
    </main>
  );
}
