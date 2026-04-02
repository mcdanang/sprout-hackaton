import { auth } from "@clerk/nextjs/server";
import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const locale = await getLocale();

  if (!userId) {
    redirect({ href: "/unauthorized", locale });
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col bg-muted/20">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
