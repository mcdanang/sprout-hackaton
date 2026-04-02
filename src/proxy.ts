import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/middleware";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  "/api/webhook(.*)",
  "/unauthorized",
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if (!userId && !isPublicRoute(request)) {
    return Response.redirect(new URL("/unauthorized", request.url));
  }

  const { supabase, response } = createClient(request);
  await supabase.auth.getUser();
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
