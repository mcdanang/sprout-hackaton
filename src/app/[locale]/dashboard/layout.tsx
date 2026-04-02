import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Signal } from "lucide-react";
import { Link, redirect } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLocale } from "next-intl/server";

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
    <div className="flex min-h-screen flex-col bg-muted/20">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-6 shadow-xs">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
            <Signal className="h-5 w-5" />
            <span>Sprout</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <UserButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
