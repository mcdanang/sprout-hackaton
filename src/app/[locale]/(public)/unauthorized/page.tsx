"use client";

import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { ShieldAlert } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function UnauthorizedPage() {
  const t = useTranslations("Unauthorized");

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">
        {t("title")}
      </h1>
      <p className="text-muted-foreground max-w-md mb-8">
        {t("description")}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <SignInButton mode="modal">
          <Button size="lg" className="px-8">
            {t("signIn")}
          </Button>
        </SignInButton>
        <Link 
          href="/" 
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-8")}
        >
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
