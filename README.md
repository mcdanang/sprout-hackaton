# Sprout Ownership Platform (Hackathon Starter)

Starter app for a safe internal platform where employees can:

- raise concerns and risks early
- share feedback with psychological safety
- recognize peers for positive ownership behavior

This project is initialized with:

- Next.js (App Router + TypeScript)
- shadcn/ui + Tailwind CSS
- Supabase client setup for browser and server
- Server Function (`use server`) example for form submission

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```bash
cp .env.example .env.local
```

Then fill:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional for future admin/server workflows)

3. Create database table in Supabase SQL editor:

Run SQL from `supabase/init.sql`.

4. Start local app:

```bash
npm run dev
```

## Current Starter Scope

- Landing page aligned to the ownership platform concept
- shadcn form for submitting:
  - concern/risk
  - recognition
- Server Function in `src/app/actions/ownership.ts`
- Supabase read/write integration:
  - insert new signal
  - show latest 5 signals

## Suggested Next Tasks For Developers

- Add authentication and role-based views (employee, manager, admin)
- Add moderation workflow for sensitive submissions
- Add tags/team/project dimensions
- Add analytics dashboard (trends: concern vs recognition)
- Add notifications (Slack/email) for urgent risks
