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
      <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/80 backdrop-blur-md px-6 shadow-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-black dark:text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFD300] text-black shadow-sm">
              <Signal className="h-5 w-5" />
            </div>
            <span className="tracking-tight">Signal</span>
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
