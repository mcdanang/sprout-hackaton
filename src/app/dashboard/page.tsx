import { OwnershipForm } from "@/components/dashboard/ownership-form";
import { RecentSignals } from "@/components/dashboard/recent-signals";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-sm font-medium uppercase tracking-wider">Overview</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Ownership Center
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Foster a culture of responsibility and recognition by sharing ownership signals with your team.
        </p>
      </section>

      <section className="grid items-start gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OwnershipForm />
        </div>
        <div className="lg:col-span-1">
          <RecentSignals />
        </div>
      </section>
    </main>
  );
}
