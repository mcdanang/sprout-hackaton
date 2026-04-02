# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured. Type-checking: `npx tsc --noEmit`.

## Architecture

**Sprout** is an internal ownership-signal platform where employees submit concerns or recognitions anonymously. Stack: Next.js 16 App Router + TypeScript, Clerk (auth), Supabase (Postgres), Tailwind CSS 4, shadcn/ui.

### Route Groups

```
src/app/
├── (public)/          # Unauthenticated routes — landing page, /unauthorized
├── dashboard/         # Protected routes — layout checks Clerk auth(), redirects to /unauthorized
└── actions/           # Server actions (ownership.ts + ownership.types.ts)
```

### Data Flow

1. `src/lib/validations/ownership.ts` — Zod schema validates form input server-side
2. `src/app/actions/ownership.ts` — Server action: validates → gets Clerk `userId` → inserts into Supabase
3. `src/components/dashboard/ownership-form.tsx` — Client component using `useActionState` + `useFormStatus`
4. `src/components/dashboard/recent-signals.tsx` — Server component querying Supabase directly

### Supabase Clients

- `src/lib/supabase/server.ts` — SSR client (uses cookies via `@supabase/ssr`), used in server actions and server components
- `src/lib/supabase/browser.ts` — Browser client, used in client components
- `src/lib/supabase/middleware.ts` — Session refresh in middleware

### Auth

Clerk wraps the root layout (`<ClerkProvider>`). Protected routes check `await auth()` in their layout and redirect to `/unauthorized` if `userId` is null. No custom session handling.

### Database

Single table `ownership_signals` — see `supabase/init.sql`. No ORM; queries use the Supabase JS client directly. RLS policies allow public read/insert.

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/
```

Validated at runtime in `src/lib/env.ts`. Copy `.env.example` → `.env.local` to start.

### Styling Conventions

Tailwind CSS 4 with CSS variables. shadcn/ui components live in `src/components/ui/`. Button variants use CVA in `src/components/ui/button.variants.ts`. Conditional classes use `clsx` + `tailwind-merge` via `src/lib/utils.ts`.
