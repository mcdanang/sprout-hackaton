import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Link, redirect } from "@/i18n/routing";
import Image from "next/image";
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
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
              <Image 
                src="/signal_logo.svg" 
                alt="Signal Logo" 
                width={20} 
                height={20} 
                className="object-contain"
              />
            </div>
            <span className="font-open-sans text-[20px] font-bold leading-[27px] text-[#081021]">
              Signal
            </span>
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
