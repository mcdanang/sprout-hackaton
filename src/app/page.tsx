import { SignInButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-background px-6 py-24 text-center md:px-12 lg:py-32">
        <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        <div className="mb-8 flex justify-center">
          <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
            Project Sprout Ownership
          </Badge>
        </div>
        
        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
          Speak Up and Recognize <br />
          <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Positive Ownership
          </span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          A safe internal platform for employees to raise concerns early and acknowledge peers who show
          ownership. Improve transparency, trust, and accountability within your team.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button size="lg" className="h-12 px-8 text-base font-semibold transition-all hover:scale-105">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link 
              href="/dashboard"
              className={cn(buttonVariants({ size: "lg" }), "h-12 px-8 text-base font-semibold")}
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Show>
          <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold">
            Learn More
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
              <h3 className="text-xl font-bold">Safe & Anonymous</h3>
              <p className="text-muted-foreground">
                Submit concerns without fear. Optional anonymity ensures every voice is heard.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Peer Recognition</h3>
              <p className="text-muted-foreground">
                Highlight excellent performance and ownership. Build a culture of appreciation.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Rapid Feedback</h3>
              <p className="text-muted-foreground">
                Get internal signals directly to decision makers to resolve blockers fast.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
