# Role-Based Concerns View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Team Concerns" tab to `/dashboard/concerns` that shows delivery leads all concerns from their projects, and shows top management all concerns across every project — with a project badge on each card.

**Architecture:** Gate logic lives in a new `getTeamConcerns()` server action (returns `null` if the user has no team access, `TeamConcernItem[]` otherwise). The page calls both `getMyConcerns()` and `getTeamConcerns()` in parallel, then passes results to the client. The client adds tabs only when `teamConcerns !== null`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase JS client, next-intl, Tailwind CSS 4, shadcn/ui.

---

## Context You Must Read First

Before touching any file, read these so you understand existing patterns:

- `src/app/actions/concerns.ts` — existing `getMyConcerns()` pipeline (yours to extend)
- `src/app/actions/concerns.types.ts` — `MyConcernItem`, `MyConcernReply`
- `src/components/dashboard/my-concerns-client.tsx` — the full client component
- `src/lib/effective-employee.ts` — `getEffectiveEmployeeRow()` returns `{ id, full_name, role_id }`
- `messages/en.json` + `messages/id.json` — i18n keys live under `Dashboard.concerns`
- `supabase/init.sql` — `projects.squad_lead_employee_id` column (how delivery lead is detected)

---

## Task 1: Extend Types in `concerns.types.ts`

**File:** `src/app/actions/concerns.types.ts`

**Step 1: Add `TeamConcernItem` type**

Append to the file:

```ts
export type TeamConcernItem = MyConcernItem & {
  projectName: string | null;
  authorName: string | null; // always resolved, even when is_anonymous = true
};
```

`MyConcernItem` already has `projectId`, `isAnonymous`, `replies`, etc. We just extend it.

**Step 2: Verify the file compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (the new type is additive).

**Step 3: Commit**

```bash
git add src/app/actions/concerns.types.ts
git commit -m "feat(concerns): add TeamConcernItem type for role-based view"
```

---

## Task 2: Add `getTeamConcerns()` Server Action

**File:** `src/app/actions/concerns.ts`

**Step 1: Add the function after the closing brace of `updateConcernStatus`**

This function has three phases:

**Phase A — Role gate (returns `null` if no access):**

```ts
export async function getTeamConcerns(): Promise<TeamConcernItem[] | null> {
  const supabase = await createClient();
  const emp = await getEffectiveEmployeeRow(supabase);
  if (!emp?.role_id) return null;

  const { data: role } = await supabase
    .from("roles")
    .select("name")
    .eq("id", emp.role_id)
    .maybeSingle();

  // Determine scope: null = all projects (top management), string[] = specific projects (delivery lead)
  let projectFilter: string[] | null = null;
  let projectNameById = new Map<string, string>();

  if (role?.name === "TOP MANAGEMENT") {
    // projectFilter stays null → no project_id filter on the query
    const { data: allProjects } = await supabase.from("projects").select("id, name");
    for (const p of allProjects ?? []) projectNameById.set(p.id, p.name);
  } else {
    // Check if squad lead of any project
    const { data: ledProjects } = await supabase
      .from("projects")
      .select("id, name")
      .eq("squad_lead_employee_id", emp.id);

    if (!ledProjects?.length) return null; // not a lead — no team tab

    projectFilter = ledProjects.map(p => p.id);
    for (const p of ledProjects) projectNameById.set(p.id, p.name);
  }
```

**Phase B — Fetch signals:**

```ts
  let signalQuery = supabase
    .from("signals")
    .select(
      "id, details, ai_issue_category, created_at, is_anonymous, concern_status, project_id, author_employee_id",
    )
    .eq("category", "concern")
    .order("created_at", { ascending: false });

  if (projectFilter !== null) {
    signalQuery = signalQuery.in("project_id", projectFilter);
  }

  const { data: signalRows, error: sigErr } = await signalQuery;
  if (sigErr || !signalRows?.length) return [];
```

**Phase C — Enrich (same pipeline as `getMyConcerns`, but also resolve author names):**

```ts
  const signalIds = signalRows.map(s => s.id);
  const authorIds = Array.from(
    new Set(signalRows.map(s => s.author_employee_id).filter(Boolean) as string[]),
  );

  const [{ data: targetRows }, { data: replyRows }, { data: authorEmps }] = await Promise.all([
    supabase
      .from("signal_targets")
      .select("signal_id, target_type, target_role_id, target_employee_id, target_organization_id")
      .in("signal_id", signalIds),
    supabase
      .from("signal_replies")
      .select("id, signal_id, author_employee_id, content, created_at")
      .in("signal_id", signalIds)
      .order("created_at", { ascending: true }),
    authorIds.length
      ? supabase.from("employees").select("id, full_name, role_id").in("id", authorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; role_id: string | null }[] }),
  ]);

  const roleIds = Array.from(
    new Set((targetRows ?? []).map(t => t.target_role_id).filter(Boolean) as string[]),
  );
  const orgIds = Array.from(
    new Set((targetRows ?? []).map(t => t.target_organization_id).filter(Boolean) as string[]),
  );
  const replyEmpIds = Array.from(
    new Set((replyRows ?? []).map(r => r.author_employee_id).filter(Boolean) as string[]),
  );

  const [{ data: roles }, { data: orgs }, { data: replyEmps }] = await Promise.all([
    roleIds.length
      ? supabase.from("roles").select("id, name").in("id", roleIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    orgIds.length
      ? supabase.from("organizations").select("id, name").in("id", orgIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    replyEmpIds.length
      ? supabase.from("employees").select("id, full_name, role_id").in("id", replyEmpIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; role_id: string | null }[] }),
  ]);

  // Resolve role names for reply authors
  const allReplyRoleIds = Array.from(
    new Set((replyEmps ?? []).map(e => e.role_id).filter(Boolean) as string[]),
  );
  const { data: replyRoles } = allReplyRoleIds.length
    ? await supabase.from("roles").select("id, name").in("id", allReplyRoleIds)
    : { data: [] as { id: string; name: string }[] };

  const roleById = new Map((roles ?? []).map(r => [r.id, r.name]));
  const orgById = new Map((orgs ?? []).map(o => [o.id, o.name]));
  const replyRoleNameById = new Map((replyRoles ?? []).map(r => [r.id, r.name]));

  const replyEmpById = new Map(
    (replyEmps ?? []).map(e => [
      e.id,
      {
        full_name: e.full_name,
        roleName: e.role_id ? (replyRoleNameById.get(e.role_id) ?? null) : null,
      },
    ]),
  );

  const authorById = new Map((authorEmps ?? []).map(e => [e.id, e.full_name]));

  const targetsBySignal = new Map<string, typeof targetRows>();
  for (const t of targetRows ?? []) {
    if (!t.signal_id) continue;
    const list = targetsBySignal.get(t.signal_id) ?? [];
    list.push(t);
    targetsBySignal.set(t.signal_id, list);
  }

  const repliesBySignal = new Map<string, typeof replyRows>();
  for (const r of replyRows ?? []) {
    if (!r.signal_id) continue;
    const list = repliesBySignal.get(r.signal_id) ?? [];
    list.push(r);
    repliesBySignal.set(r.signal_id, list);
  }

  function buildTargetLabel(signalId: string): string {
    const targets = targetsBySignal.get(signalId) ?? [];
    const t = targets[0];
    if (!t) return "Visible to team";
    if (t.target_type === "all") return "Visible to everyone";
    if (t.target_type === "role" && t.target_role_id) {
      const roleName = roleById.get(t.target_role_id) ?? "Role";
      if (roleName === "TOP MANAGEMENT") return "To Management";
      return `To Role: ${roleName}`;
    }
    if (t.target_type === "employee" && t.target_employee_id) {
      return `To Specific Person`;
    }
    if (t.target_type === "organization" && t.target_organization_id) {
      const name = orgById.get(t.target_organization_id) ?? "Division";
      return `To Division: ${name}`;
    }
    return "Visible to team";
  }

  const result: TeamConcernItem[] = [];

  for (const s of signalRows) {
    const repliesRaw = repliesBySignal.get(s.id) ?? [];
    const replyCount = repliesRaw.length;
    const status = deriveDisplayStatus(s.concern_status, replyCount);

    const replies: MyConcernReply[] = repliesRaw.map(r => {
      const author = replyEmpById.get(r.author_employee_id);
      return {
        id: r.id,
        content: r.content ?? "",
        createdAt: new Date(r.created_at).toISOString(),
        authorName: author?.full_name ?? "Unknown",
        roleName: author?.roleName ?? null,
      };
    });

    result.push({
      id: s.id,
      details: s.details ?? "",
      issueCategory: s.ai_issue_category ?? "others",
      createdAt: new Date(s.created_at).toISOString(),
      isAnonymous: Boolean(s.is_anonymous),
      targetLabel: buildTargetLabel(s.id),
      status,
      projectId: s.project_id ?? null,
      projectName: s.project_id ? (projectNameById.get(s.project_id) ?? null) : null,
      authorName: authorById.get(s.author_employee_id) ?? null,
      replies,
    });
  }

  return result;
}
```

**Step 2: Add `TeamConcernItem` to the import at the top of `concerns.ts`**

Find the existing import line:
```ts
import { type ConcernActionState, type MyConcernItem, type MyConcernReply } from "./concerns.types";
```

Replace with:
```ts
import { type ConcernActionState, type MyConcernItem, type MyConcernReply, type TeamConcernItem } from "./concerns.types";
```

**Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/app/actions/concerns.ts
git commit -m "feat(concerns): add getTeamConcerns() server action with role-based scoping"
```

---

## Task 3: Add i18n Strings

**Files:** `messages/en.json`, `messages/id.json`

**Step 1: Add keys to `messages/en.json`**

Inside `Dashboard.concerns` object (after the last existing key in that object), add:

```json
"tabMyConcerns": "My Concerns",
"tabTeamConcerns": "Team Concerns",
"teamEmptyTitle": "No concerns yet",
"teamEmptyHint": "Concerns submitted by your project team will appear here.",
"projectTag": "Project"
```

**Step 2: Add keys to `messages/id.json`**

Same location:

```json
"tabMyConcerns": "Keluhan Saya",
"tabTeamConcerns": "Keluhan Tim",
"teamEmptyTitle": "Belum ada keluhan",
"teamEmptyHint": "Keluhan yang dikirim oleh tim project Anda akan muncul di sini.",
"projectTag": "Proyek"
```

**Step 3: Commit**

```bash
git add messages/en.json messages/id.json
git commit -m "feat(concerns): add i18n keys for team concerns tab"
```

---

## Task 4: Update `concerns/page.tsx`

**File:** `src/app/[locale]/dashboard/concerns/page.tsx`

**Step 1: Replace the file contents**

```tsx
import { getMyConcerns, getTeamConcerns } from "@/app/actions/concerns";
import { MyConcernsClient } from "@/components/dashboard/my-concerns-client";

export default async function ConcernsPage() {
  const [myConcerns, teamConcerns] = await Promise.all([
    getMyConcerns(),
    getTeamConcerns(),
  ]);

  return (
    <MyConcernsClient
      initialConcerns={myConcerns}
      initialTeamConcerns={teamConcerns}
    />
  );
}
```

`teamConcerns` is `null` when the user has no team access (regular staff) — the client uses this to decide whether to render a tab.

**Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: error on `MyConcernsClient` because props haven't been updated yet — that's fine, resolved in Task 5.

**Step 3: Commit**

```bash
git add src/app/[locale]/dashboard/concerns/page.tsx
git commit -m "feat(concerns): pass team concerns to client component"
```

---

## Task 5: Update `my-concerns-client.tsx`

**File:** `src/components/dashboard/my-concerns-client.tsx`

This is the biggest change. Here's the full updated file:

**Step 1: Update the `Props` type and add imports**

At the top of the file, update imports to add `TeamConcernItem`:

```tsx
import { type MyConcernItem, type TeamConcernItem } from "@/app/actions/concerns.types";
```

Update `Props`:

```tsx
type Props = {
  initialConcerns: MyConcernItem[];
  initialTeamConcerns: TeamConcernItem[] | null; // null = no team tab
};
```

**Step 2: Add a `ProjectBadge` component**

After `StatusBadge`, add:

```tsx
function ProjectBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-primary ring-1 ring-brand-primary/20">
      {name}
    </span>
  );
}
```

**Step 3: Add `TeamConcernCard` component**

After the existing `ConcernCard` component, add:

```tsx
function TeamConcernCard({ item }: { item: TeamConcernItem }) {
  const t = useTranslations("Dashboard.concerns");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <article className={cn(
      "group relative bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 overflow-hidden",
      item.projectId && "cursor-pointer"
    )}>
      <div className="absolute -inset-1 bg-linear-to-r from-brand-primary/0 via-brand-primary/5 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute -inset-full [background:conic-gradient(from_0deg,transparent_0_80%,#FFD300_100%)] animate-[border-rotate_4s_linear_infinite]" />
        <div className="absolute inset-px bg-white rounded-[31px]" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 ring-1 ring-slate-100 group-hover:bg-brand-primary/5 group-hover:text-brand-primary transition-colors">
              {item.issueCategory}
            </span>
            <span className="text-[12px] font-bold font-plus-jakarta text-slate-400 group-hover:text-slate-500 transition-colors">
              {item.targetLabel}
            </span>
            {item.projectName ? <ProjectBadge name={item.projectName} /> : null}
          </div>
          <StatusBadge status={item.status} />
        </div>

        <FormattedContent
          content={item.details}
          className="mt-6 font-plus-jakarta text-[16px] leading-relaxed text-slate-700 group-hover:text-slate-900 transition-colors"
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 pt-6 group-hover:border-slate-100 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-slate-500 transition-colors font-medium">
              <Clock className="size-4 shrink-0 transition-transform group-hover:scale-110" />
              <time dateTime={item.createdAt}>{formatDate(item.createdAt, locale)}</time>
            </div>
            {item.authorName ? (
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
                <User className="size-3.5 shrink-0" />
                <span>
                  {item.isAnonymous
                    ? `${item.authorName} (${t("submittedAnonymous")})`
                    : item.authorName}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {item.replies.length > 0 ? (
          <div className="mt-6 rounded-2xl bg-slate-50/50 p-1 group-hover:bg-slate-50 transition-colors">
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 transition-all hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <ChatLines className="size-4 shrink-0 text-brand-primary" />
                <span>{t("repliesCount", { count: item.replies.length })}</span>
              </div>
              <ArrowRight className={cn("size-4 transition-transform duration-300", open && "rotate-90")} />
            </button>
            {open ? (
              <ul className="mt-1 space-y-2 p-1">
                {item.replies.map(r => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-slate-100 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-bold text-brand-primary">
                        {r.authorName}
                        {r.roleName ? (
                          <span className="ml-1.5 font-plus-jakarta text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {formatReplyRole(r.roleName)}
                          </span>
                        ) : null}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                        <Clock className="size-3" />
                        <time dateTime={r.createdAt}>{formatDate(r.createdAt, locale)}</time>
                      </div>
                    </div>
                    <FormattedContent content={r.content} className="text-slate-600" />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
```

**Step 4: Update `MyConcernsClient` to add tabs**

Replace the `MyConcernsClient` export function:

```tsx
export function MyConcernsClient({ initialConcerns, initialTeamConcerns }: Props) {
  const t = useTranslations("Dashboard.concerns");
  const hasTeamTab = initialTeamConcerns !== null;
  const [activeTab, setActiveTab] = useState<"my" | "team">("my");

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-4">
          <p className="font-plus-jakarta text-[12px] font-semibold leading-[16px] tracking-[1.2px] uppercase text-[#B09100]">
            {t("eyebrow")}
          </p>
          <h1 className="font-plus-jakarta text-[48px] font-bold leading-[48px] tracking-[-1.2px] text-brand-primary">
            {t("title")}
          </h1>
          <p className="font-plus-jakarta text-[18px] font-normal leading-[28px] text-dashboard-description max-w-2xl">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {hasTeamTab ? (
        <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("my")}
            className={cn(
              "rounded-xl px-5 py-2 text-sm font-semibold transition-all",
              activeTab === "my"
                ? "bg-white text-brand-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t("tabMyConcerns")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("team")}
            className={cn(
              "rounded-xl px-5 py-2 text-sm font-semibold transition-all",
              activeTab === "team"
                ? "bg-white text-brand-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t("tabTeamConcerns")}
          </button>
        </div>
      ) : null}

      {activeTab === "my" || !hasTeamTab ? (
        initialConcerns.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-20 text-center">
            <ChatLines className="mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">{t("emptyTitle")}</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">{t("emptyHint")}</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {initialConcerns.map(item => (
              <li key={item.id}>
                {item.projectId ? (
                  <Link href={`/dashboard/projects/${item.projectId}#signal-${item.id}`}>
                    <ConcernCard item={item} />
                  </Link>
                ) : (
                  <ConcernCard item={item} />
                )}
              </li>
            ))}
          </ul>
        )
      ) : null}

      {activeTab === "team" && hasTeamTab ? (
        !initialTeamConcerns?.length ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-20 text-center">
            <ChatLines className="mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">{t("teamEmptyTitle")}</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">{t("teamEmptyHint")}</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {initialTeamConcerns.map(item => (
              <li key={item.id}>
                {item.projectId ? (
                  <Link href={`/dashboard/projects/${item.projectId}#signal-${item.id}`}>
                    <TeamConcernCard item={item} />
                  </Link>
                ) : (
                  <TeamConcernCard item={item} />
                )}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
```

**Step 5: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

**Step 6: Commit**

```bash
git add src/components/dashboard/my-concerns-client.tsx
git commit -m "feat(concerns): add tabs and TeamConcernCard with project badge"
```

---

## Task 6: Manual Verification

Start the dev server and verify each persona:

```bash
npm run dev
```

**Verify as Staff (no team tab):**
1. Open `http://localhost:3000/en/dashboard/concerns`
2. Switch persona to "Staff" via "View app as"
3. Expected: only "My Concerns" — no tabs visible

**Verify as Delivery Lead (Reynaldo):**
1. Switch persona to "Delivery lead (Reynaldo)"
2. Expected: two tabs — "My Concerns" (empty, since Reynaldo hasn't submitted) and "Team Concerns"
3. Click "Team Concerns" — expected: all concerns from Reynaldo's projects, each card with a yellow project badge showing the project name
4. If a concern was submitted anonymously, it should show: `Reynaldo Damara Salim (Anonymous)`

**Verify as Top Management:**
1. Switch persona to management
2. Expected: two tabs — "My Concerns" and "Team Concerns"
3. Click "Team Concerns" — expected: ALL concerns from all projects, each with project badge

**Verify project badge styling:**
- Badge should be brand-primary (yellow) background with brand-primary text
- Appears next to the issue category chip

---

## Task 7: Final Lint and Commit

```bash
npm run lint
```

Fix any lint errors, then:

```bash
git add -A
git commit -m "fix: resolve lint warnings in concerns role-based view"
```
