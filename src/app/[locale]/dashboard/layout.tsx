import { auth } from "@clerk/nextjs/server";
import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

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
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}
