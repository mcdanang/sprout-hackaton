import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Signal } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/unauthorized");
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
            <UserButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
