import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const isPublicRoute = createRouteMatcher([
  "/:locale",
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
  "/:locale/unauthorized",
  "/", // Root redirect
]);

export default clerkMiddleware(async (auth, request) => {
  // Step 1: Handle i18n (skip for API routes)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const response = isApiRoute ? null : intlMiddleware(request);

  // Step 2: Handle Auth
  const { userId } = await auth();

  if (!userId && !isPublicRoute(request)) {
    // Extract locale from path or default to 'en'
    const locale = request.nextUrl.pathname.split('/')[1] || 'en';
    const unauthorizedUrl = new URL(`/${locale}/unauthorized`, request.url);
    return Response.redirect(unauthorizedUrl);
  }

  return response ?? NextResponse.next();
});

export const config = {
  matcher: [
    // Enable i18n for all routes except static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
