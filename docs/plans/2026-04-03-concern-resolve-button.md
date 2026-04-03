# Concern Resolve Button Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Resolve" button to concern activity cards that squad leads can use to mark a concern as closed, with full visual feedback on the resolved state.

**Architecture:** `concernStatus` is threaded from the DB through `getProjectDetail()` → `ActivityItem` → `ActivityCard`. `isSquadLead` is computed server-side in `getProjectDetail()` by comparing `squad_lead_employee_id` with the current employee ID, then passed as a prop down through `ProjectDetailClient` → `ActivityFeed` → `ActivityCard`. A new `resolveConcern()` server action handles the DB update with authorization guard.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase JS client, lucide-react (`CheckCheck`, `CheckCircle2`), Tailwind CSS 4.

---

## Context You Must Read First

Before touching any file, read these:

- `src/lib/constants/activity.ts` — `ActivityItem` interface (add `concernStatus` here)
- `src/app/actions/projects.ts:270-400` — `getProjectDetail()`, signals select, activities mapping
- `src/app/[locale]/dashboard/projects/[id]/page.tsx` — page passes `{ project, activities }` to client
- `src/components/dashboard/project-detail-client.tsx` — receives `project` + `activities` props
- `src/components/dashboard/activity-feed.tsx` — receives `activities` + `projectName`, passes to `ActivityCard`
- `src/components/dashboard/activity-card.tsx` — full card component, add resolve button here
- `src/app/actions/signal-interactions.ts` — existing `createSignalReply`, `toggleSignalLike` — add `resolveConcern` here

**Key data facts from `supabase/seed.sql`:**
- Role names: `TOP MANAGEMENT`, `SQUAD LEAD`, `STAFF` (exact casing)
- `projects.squad_lead_employee_id` is a FK to `employees.id` (Supabase UUID, NOT Clerk `auth_id`)
- `signals.concern_status` column: `"open" | "in_progress" | "closed" | null`

---

## Task 1: Extend `ActivityItem` Type

**File:** `src/lib/constants/activity.ts`

**Step 1: Add `concernStatus` field to the interface**

Find the `ActivityItem` interface and add one field after `replies?`:

```ts
export interface ActivityItem {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  type: "concern" | "achievement" | "kudos" | "status";
  content: string;
  timestamp: string;
  likesCount: number;
  isLiked: boolean;
  isPublic: boolean;
  replies?: ReplyItem[];
  concernStatus?: "open" | "in_progress" | "closed" | null; // only populated for type === "concern"
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (field is optional, backward-compatible).

**Step 3: Commit**

```bash
git add src/lib/constants/activity.ts
git commit -m "feat(resolve): add concernStatus to ActivityItem type"
```

---

## Task 2: Update `getProjectDetail()` to Return `concernStatus` and `isSquadLead`

**File:** `src/app/actions/projects.ts`

**Step 1: Add `concern_status` to the signals select query**

Find this line (around line 352):
```ts
const { data: signals } = await supabase
  .from("signals")
  .select(
    "id, project_id, author_employee_id, is_anonymous, category, title, details, created_at, is_public, sentiment_score, ai_issue_category",
  )
```

Replace with:
```ts
const { data: signals } = await supabase
  .from("signals")
  .select(
    "id, project_id, author_employee_id, is_anonymous, category, title, details, created_at, is_public, sentiment_score, ai_issue_category, concern_status",
  )
```

**Step 2: Add `squad_lead_employee_id` to the project select query**

Find this line (around line 278):
```ts
const { data: projectRow } = await supabase
  .from("projects")
  .select("id, name, description")
  .eq("id", projectId)
  .maybeSingle();
```

Replace with:
```ts
const { data: projectRow } = await supabase
  .from("projects")
  .select("id, name, description, squad_lead_employee_id")
  .eq("id", projectId)
  .maybeSingle();
```

**Step 3: Compute `isSquadLead`**

After the `const currentEmployeeId = await getCurrentEmployeeId(supabase);` line (around line 454), add:

```ts
const isSquadLead =
  !!currentEmployeeId &&
  !!projectRow.squad_lead_employee_id &&
  projectRow.squad_lead_employee_id === currentEmployeeId;
```

**Step 4: Map `concern_status` in the activities array**

In the `activities` mapping (around line 521), add `concernStatus` to the returned object:

```ts
return {
  id: s.id,
  projectId: s.project_id ?? projectId,
  userId: s.author_employee_id,
  userName,
  userAvatar,
  type: activityType,
  content: s.details,
  timestamp: new Date(s.created_at).toISOString(),
  likesCount: likesBySignal.get(s.id) ?? 0,
  isLiked: likedSignalIds.has(s.id),
  isPublic: s.is_public ?? true,
  replies: repliesBySignal.get(s.id) ?? [],
  concernStatus: s.category === "concern"
    ? ((s as { concern_status?: string | null }).concern_status as "open" | "in_progress" | "closed" | null ?? null)
    : null,
};
```

**Step 5: Update the return statement of `getProjectDetail()`**

Find the final return (around line 548):
```ts
return { project, activities };
```

Replace with:
```ts
return { project, activities, isSquadLead };
```

**Step 6: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

**Step 7: Commit**

```bash
git add src/app/actions/projects.ts
git commit -m "feat(resolve): add concernStatus and isSquadLead to getProjectDetail"
```

---

## Task 3: Thread `isSquadLead` Down the Component Tree

**Files:** `src/app/[locale]/dashboard/projects/[id]/page.tsx`, `src/components/dashboard/project-detail-client.tsx`, `src/components/dashboard/activity-feed.tsx`

**Step 1: Update the page to pass `isSquadLead`**

In `src/app/[locale]/dashboard/projects/[id]/page.tsx`, replace:

```tsx
const { project, activities } = await getProjectDetail(id);
```

with:

```tsx
const { project, activities, isSquadLead } = await getProjectDetail(id);
```

And update the render:

```tsx
return <ProjectDetailClient project={project} activities={activities} isSquadLead={isSquadLead} />;
```

**Step 2: Update `ProjectDetailClient` props**

In `src/components/dashboard/project-detail-client.tsx`, find:

```tsx
interface Props {
  project: Project;
  activities: ActivityItem[];
}
```

Replace with:

```tsx
interface Props {
  project: Project;
  activities: ActivityItem[];
  isSquadLead: boolean;
}
```

And update the function signature:

```tsx
export function ProjectDetailClient({ project, activities, isSquadLead }: Props) {
```

Then find where `<ActivityFeed` is rendered and add the prop:

```tsx
<ActivityFeed
  activities={activities}
  projectName={project.name}
  isSquadLead={isSquadLead}
/>
```

**Step 3: Update `ActivityFeed` props**

In `src/components/dashboard/activity-feed.tsx`, find:

```tsx
interface Props {
  activities: ActivityItem[];
  projectName: string;
}
```

Replace with:

```tsx
interface Props {
  activities: ActivityItem[];
  projectName: string;
  isSquadLead: boolean;
}
```

Update the function signature:

```tsx
export function ActivityFeed({ activities, projectName, isSquadLead }: Props) {
```

And pass it to each `ActivityCard`:

```tsx
<ActivityCard
  key={activity.id}
  activity={activity}
  index={index}
  isSquadLead={isSquadLead}
  onReplyCreated={handleReplyCreated}
/>
```

**Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: error on `ActivityCard` missing `isSquadLead` prop — that's expected, resolved in Task 5.

**Step 5: Commit**

```bash
git add src/app/[locale]/dashboard/projects/[id]/page.tsx src/components/dashboard/project-detail-client.tsx src/components/dashboard/activity-feed.tsx
git commit -m "feat(resolve): thread isSquadLead prop through project detail components"
```

---

## Task 4: Add `resolveConcern` Server Action

**File:** `src/app/actions/signal-interactions.ts`

**Step 1: Add the function at the end of the file**

```ts
export async function resolveConcern(signalId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const employee = await getCurrentEmployee(supabase);
  if (!employee) throw new Error("Unauthorized");

  const roleName = await getRoleName({ supabase, roleId: employee.role_id });
  if (roleName !== "SQUAD LEAD") throw new Error("Unauthorized: only squad leads can resolve concerns");

  // Verify the signal is a concern in a project this squad lead owns
  const { data: signalRow } = await supabase
    .from("signals")
    .select("id, category, project_id, concern_status")
    .eq("id", signalId)
    .maybeSingle();

  if (!signalRow) throw new Error("Signal not found");
  if (signalRow.category !== "concern") throw new Error("Only concerns can be resolved");
  if (signalRow.concern_status === "closed") return { ok: true }; // already closed, idempotent

  // Verify this squad lead owns the project
  const { data: projectRow } = await supabase
    .from("projects")
    .select("id")
    .eq("id", signalRow.project_id)
    .eq("squad_lead_employee_id", employee.id)
    .maybeSingle();

  if (!projectRow) throw new Error("Unauthorized: not the squad lead of this project");

  const { error } = await supabase
    .from("signals")
    .update({ concern_status: "closed" })
    .eq("id", signalId);

  if (error) throw new Error(error.message);

  return { ok: true };
}
```

**Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/app/actions/signal-interactions.ts
git commit -m "feat(resolve): add resolveConcern server action with squad lead auth guard"
```

---

## Task 5: Update `ActivityCard` — Resolve Button + Resolved Visual State

**File:** `src/components/dashboard/activity-card.tsx`

**Step 1: Update imports**

Replace the existing lucide-react import line:
```tsx
import { Heart, Clock, Lock, User, Loader2 } from "lucide-react";
```

With:
```tsx
import { Heart, Clock, Lock, User, Loader2, CheckCheck, CheckCircle2 } from "lucide-react";
```

Also import the new server action — add to the existing action import line:
```tsx
import { createSignalReply, toggleSignalLike, resolveConcern } from "@/app/actions/signal-interactions";
```

**Step 2: Update `Props` interface**

Find:
```tsx
interface Props {
  activity: ActivityItem;
  index: number;
  onReplyCreated?: (params: {
    activityId: string;
    reply: NonNullable<ActivityItem["replies"]>[number];
  }) => void;
}
```

Replace with:
```tsx
interface Props {
  activity: ActivityItem;
  index: number;
  isSquadLead: boolean;
  onReplyCreated?: (params: {
    activityId: string;
    reply: NonNullable<ActivityItem["replies"]>[number];
  }) => void;
}
```

**Step 3: Add state and handler inside `ActivityCard`**

After the existing state declarations (`isReplying`, `isSending`, etc.), add:

```tsx
const [concernStatus, setConcernStatus] = useState(activity.concernStatus ?? null);
const [isResolving, setIsResolving] = useState(false);
```

Update the `useEffect` that syncs with activity prop changes to also sync `concernStatus`:

```tsx
useEffect(() => {
  setLikesCount(activity.likesCount);
  setIsLiked(activity.isLiked);
  setReplies(activity.replies ?? []);
  setConcernStatus(activity.concernStatus ?? null);
}, [activity.id, activity.likesCount, activity.isLiked, activity.replies, activity.concernStatus]);
```

Add the resolve handler after `handleSend`:

```tsx
const handleResolve = async () => {
  if (isResolving || concernStatus === "closed") return;
  setIsResolving(true);
  try {
    await resolveConcern(activity.id);
    setConcernStatus("closed");
  } catch (e) {
    console.error(e);
  } finally {
    setIsResolving(false);
  }
};
```

**Step 4: Update the card root `div` to apply resolved styles**

The resolved state changes the card container. Find the outer `div` with `id={signal-...}`:

```tsx
<div
  id={`signal-${activity.id}`}
  className={cn(
    "group relative rounded-[24px] p-6 border shadow-sm transition-all hover:shadow-md hover:border-brand-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both scroll-mt-32",
    concernStatus === "closed"
      ? "bg-emerald-50/30 border-slate-100 border-l-4 border-l-emerald-400"
      : "bg-white border-slate-100",
    !activity.isPublic && concernStatus !== "closed" && "border-l-4 border-l-slate-200"
  )}
  style={{ animationDelay: `${(index % 5) * 100}ms` }}
>
```

**Step 5: Update the signal type icon to change when resolved**

Find the icon `div` block:
```tsx
<div className={cn("h-12 w-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", Style.bgColor, Style.color)}>
  <Icon className="h-6 w-6" />
</div>
```

Replace with:
```tsx
<div className={cn(
  "h-12 w-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
  activity.type === "concern" && concernStatus === "closed"
    ? "bg-emerald-50 text-emerald-500"
    : cn(Style.bgColor, Style.color)
)}>
  {activity.type === "concern" && concernStatus === "closed"
    ? <CheckCircle2 className="h-6 w-6" />
    : <Icon className="h-6 w-6" />
  }
</div>
```

**Step 6: Add "Resolved" badge in the header row**

Find the header row (the `div` containing avatar + name on left, timestamp on right). Add the resolved badge inside the right-side `div`, before the timestamp cluster:

```tsx
<div className="flex items-center gap-2 text-slate-600 shrink-0">
  {concernStatus === "closed" && activity.type === "concern" && (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
      <CheckCircle2 className="h-2.5 w-2.5" />
      Resolved
    </span>
  )}
  {!activity.isPublic && (
    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
      <Lock className="h-2.5 w-2.5" />
      Private
    </span>
  )}
  <div className="flex items-center gap-1.5">
    <Clock className="h-3 w-3" />
    <span className="text-[10px] font-bold uppercase tracking-wider">
      {getRelativeTime(activity.timestamp)}
    </span>
  </div>
</div>
```

**Step 7: Add the Resolve button in the action bar**

Find the action bar (the `div` containing the Like button and Reply button). After the Reply `<button>`, add:

```tsx
{activity.type === "concern" && isSquadLead && replies.length > 0 && concernStatus !== "closed" && (
  <button
    onClick={handleResolve}
    disabled={isResolving}
    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all group/resolve disabled:opacity-50"
  >
    {isResolving ? (
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    ) : (
      <CheckCheck className="h-3.5 w-3.5 transition-transform group-hover/resolve:scale-110" />
    )}
    <span className="font-plus-jakarta text-xs font-bold">Resolve</span>
  </button>
)}
```

**Step 8: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

**Step 9: Commit**

```bash
git add src/components/dashboard/activity-card.tsx
git commit -m "feat(resolve): add resolve button and resolved visual state to ActivityCard"
```

---

## Task 6: Manual Verification

Start dev server:
```bash
npm run dev
```

**Test as Fian (Squad Lead of Hackathon Signal):**
1. Open `http://localhost:3000/en/dashboard/projects/<hackathon-signal-id>`
2. Find Eldaa's concern card
3. Expected: **no Resolve button** (no replies yet)
4. Click Reply, type something, send
5. Expected: **Resolve button appears** (green, `[✓ Resolve]`) in action bar
6. Click Resolve
7. Expected:
   - Card background turns `bg-emerald-50/30`
   - Left border turns green
   - Icon changes from red `AlertCircle` → green `CheckCircle2`
   - `✓ Resolved` badge appears in header
   - Resolve button disappears

**Test as Reynaldo (Squad Lead of BOUCHON — NOT Hackathon Signal):**
1. Switch persona to "Delivery lead (Reynaldo)"
2. Open a project where Reynaldo is squad lead
3. Concerns in HIS projects: Resolve button appears ✓
4. Open Hackathon Signal → Resolve button should NOT appear (not his project) ✓

**Test as Top Management (Azki):**
1. Switch persona to management
2. Open any project with a concern that has replies
3. Resolve button should NOT appear (only squad leads can resolve) ✓

**Test as Staff:**
1. Any concern with replies → no Resolve button ✓

---

## Task 7: Lint + Final Commit

```bash
npm run lint
```

Fix any lint errors, then:
```bash
git add -A
git commit -m "fix: resolve lint warnings in concern resolve feature"
```
