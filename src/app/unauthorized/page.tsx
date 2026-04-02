import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function UnauthorizedPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">Access Denied</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        You are trying to access a protected area. Please sign in to continue or return to the landing page.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <SignInButton mode="modal">
          <Button size="lg" className="px-8">
            Sign In Now
          </Button>
        </SignInButton>
        <Link 
          href="/" 
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-8")}
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
