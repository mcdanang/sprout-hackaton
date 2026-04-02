import { SignInButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Landing");

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-background px-6 py-24 text-center md:px-12 lg:py-32">
        <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        <div className="mb-8 flex justify-center">
          <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
            {t("badge")}
          </Badge>
        </div>
        
        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
          {t("title")}
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {t("description")}
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button size="lg" className="h-12 px-8 text-base font-semibold transition-all hover:scale-105">
                {t("getStarted")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link 
              href="/dashboard"
              className={cn(buttonVariants({ size: "lg" }), "h-12 px-8 text-base font-semibold")}
            >
              {t("goDashboard")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Show>
          <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold">
            {t("learnMore")}
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{t("features.safe.title")}</h3>
              <p className="text-muted-foreground">
                {t("features.safe.description")}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{t("features.peer.title")}</h3>
              <p className="text-muted-foreground">
                {t("features.peer.description")}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{t("features.rapid.title")}</h3>
              <p className="text-muted-foreground">
                {t("features.rapid.description")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
