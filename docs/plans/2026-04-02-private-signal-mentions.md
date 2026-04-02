# Private Signal + @Mention Targeting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up the SignalModal to real Supabase data — resolve the author from Clerk session, support `@mention` of project teammates in the textarea, store mentions as `signal_targets`, and visually differentiate private vs public signals in the Activity Feed.

**Architecture:**
`@mention` **always** writes rows to `signal_targets` regardless of `is_public`. `is_public` is purely a visibility flag: when `true`, everyone in the project can see the signal and the mentioned employees are treated as tagged/cc'd; when `false`, only the mentioned employees can see it. If no one is `@mentioned`, a single `target_type = 'all'` row is inserted as a fallback. The server action resolves the author employee from the Clerk `auth_id` (never trust client-sent `authorEmployeeId`). A lightweight dropdown hooks into the textarea `onChange` to detect `@` and fetch project employees.

**Tech Stack:** Next.js 16 App Router, Supabase (server-side client), Clerk (`auth()` from `@clerk/nextjs/server`), Zod, Tailwind CSS 4, TypeScript

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/actions/signals.ts` | `createSignal` server action |
| `src/app/actions/employees.ts` | `getEmployees` server action |
| `src/app/actions/employees.types.ts` | `EmployeesListFilters`, `EmployeeRecord` |
| `src/lib/validations/signal.ts` | Zod schema for signal form |
| `src/lib/constants/activity.ts` | `ActivityItem` type |
| `src/app/actions/projects.ts` | `getProjectDetail` — fetches signals for feed |
| `src/components/dashboard/signal-modal.tsx` | Modal UI (currently simulated) |
| `src/components/dashboard/activity-card.tsx` | Single activity card |
| `src/components/dashboard/project-detail-client.tsx` | Page client — renders modal + feed |

---

## Task 1: Add `projectId` filter to `getEmployees`

**Why:** The `@` mention picker needs to fetch only employees in the current project. `EmployeesListFilters` has no `projectId` field yet, and the query in `getEmployees` never filters by `project_id`.

**Files:**
- Modify: `src/app/actions/employees.types.ts`
- Modify: `src/app/actions/employees.ts`

**Step 1: Add `projectId` to `EmployeesListFilters`**

In `employees.types.ts`, add `projectId` to the filters type:

```ts
export type EmployeesListFilters = {
  organizationId?: string;
  roleId?: string;
  organizationName?: string;
  roleName?: string;
  onlyActive?: boolean;
  projectId?: string; // ADD THIS
};
```

**Step 2: Apply the filter in the query**

In `employees.ts`, after the existing `if (filters?.onlyActive)` line, add:

```ts
if (filters?.projectId) query = query.eq("project_id", filters.projectId);
```

**Step 3: Verify manually**

Call `getEmployees({ projectId: "<some-uuid>" })` from a test page or server component and confirm it returns only employees for that project.

**Step 4: Commit**

```bash
git add src/app/actions/employees.types.ts src/app/actions/employees.ts
git commit -m "feat: add projectId filter to getEmployees"
```

---

## Task 2: Update `signalSchema` — single target → multiple employee targets

**Why:** `createSignal` currently supports one `targetEmployeeId`. We need an array so multiple `@mentioned` employees can each get a `signal_targets` row.

**Files:**
- Modify: `src/lib/validations/signal.ts`

**Step 1: Replace `targetEmployeeId` with `targetEmployeeIds`**

```ts
import { z } from "zod";

export const signalSchema = z.object({
  category: z.enum(["concern", "achievement", "appreciation"]),
  title: z.string().min(4, "Title must be at least 4 characters.").max(100),
  details: z
    .string()
    .min(10, "Details must be at least 10 characters for useful context.")
    .max(2000),
  isAnonymous: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  projectId: z.string().uuid().nullable().optional(),

  // @mentioned employees — always stored as signal_targets regardless of isPublic.
  // isPublic only controls visibility, not whether targets exist.
  // If empty and isPublic=true → server inserts a single 'all' target as fallback.
  targetEmployeeIds: z.array(z.string().uuid()).default([]),
});

export type SignalFormValues = z.infer<typeof signalSchema>;
```

> **Note:** `authorEmployeeId` and `targetRoleId` are removed — author is resolved server-side from Clerk, and role targeting is not used by the modal UI.

**Step 2: Commit**

```bash
git add src/lib/validations/signal.ts
git commit -m "feat: update signalSchema to support multiple employee targets"
```

---

## Task 3: Update `createSignal` server action

**Why:** 
1. `authorEmployeeId` must be resolved server-side from Clerk `auth_id` (pattern from `ownership.ts` line 47–51) — never trust it from the client.
2. `@mention` always writes `signal_targets` rows regardless of `is_public`.
3. `is_public` is a visibility flag only — not a switch between "has targets" vs "no targets".
4. Fallback: if no `@mentions`, insert one `target_type = 'all'` row so the signal always has at least one target.

**Files:**
- Modify: `src/app/actions/signals.ts`

**Step 1: Replace the entire `createSignal` function**

```ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { signalSchema } from "@/lib/validations/signal";
import { type SignalActionState } from "./signal.types";

export async function createSignal(
  _prevState: SignalActionState,
  formData: FormData,
): Promise<SignalActionState> {
  const { userId } = await auth();
  if (!userId) return { status: "error", message: "Unauthorized" };

  const supabase = await createClient();

  // Resolve author from Clerk auth_id — never trust client-sent employee ID
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id")
    .eq("auth_id", userId)
    .maybeSingle();

  if (empError || !employee) {
    return { status: "error", message: "Employee profile not found." };
  }

  const raw = {
    category: formData.get("category"),
    title: formData.get("title"),
    details: formData.get("details"),
    isAnonymous: formData.get("isAnonymous") === "on",
    isPublic: formData.get("isPublic") === "on",
    projectId: formData.get("projectId") || null,
    targetEmployeeIds: formData.getAll("targetEmployeeIds[]").filter(Boolean),
  };

  const validated = signalSchema.safeParse(raw);
  if (!validated.success) {
    return {
      status: "error",
      message: "Invalid signal data",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const v = validated.data;

  try {
    const { data: created, error: insertError } = await supabase
      .from("signals")
      .insert({
        author_employee_id: employee.id,
        is_anonymous: v.isAnonymous,
        category: v.category,
        title: v.title.trim(),
        details: v.details.trim(),
        project_id: v.projectId ?? null,
        is_public: v.isPublic,
      })
      .select("id")
      .maybeSingle();

    if (insertError || !created?.id) {
      return { status: "error", message: insertError?.message ?? "Failed to create signal" };
    }

    if (v.targetEmployeeIds.length > 0) {
      // @mentions present → always insert one row per mentioned employee.
      // is_public controls WHO CAN SEE the signal, not whether targets exist.
      await supabase.from("signal_targets").insert(
        v.targetEmployeeIds.map((empId) => ({
          signal_id: created.id,
          target_type: "employee",
          target_role_id: null,
          target_employee_id: empId,
        })),
      );
    } else {
      // No @mentions → fallback: visible to all (regardless of is_public toggle)
      await supabase.from("signal_targets").insert({
        signal_id: created.id,
        target_type: "all",
        target_role_id: null,
        target_employee_id: null,
      });
    }

    revalidatePath("/");
    return { status: "success", message: "Signal created." };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Error" };
  }
}
```

**Step 2: Keep `getSignals` unchanged** (leave it as-is at the bottom of the file).

**Step 3: Commit**

```bash
git add src/app/actions/signals.ts
git commit -m "feat: resolve author from Clerk in createSignal, support multiple employee targets"
```

---

## Task 4: Add `isPublic` to `ActivityItem` and update `getProjectDetail`

**Why:** The feed needs to know if a signal is private to render the badge.

**Files:**
- Modify: `src/lib/constants/activity.ts`
- Modify: `src/app/actions/projects.ts`

**Step 1: Add `isPublic` to `ActivityItem`**

In `activity.ts`, update the interface:

```ts
export interface ActivityItem {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: "concern" | "achievement" | "kudos" | "status";
  content: string;
  timestamp: string;
  likesCount: number;
  isLiked: boolean;
  isPublic: boolean; // ADD THIS
  replies?: ReplyItem[];
}
```

**Step 2: Include `is_public` in `getProjectDetail` signal select**

In `projects.ts`, find the signals select query (around line 157):

```ts
const { data: signals } = await supabase
  .from("signals")
  .select(
    "id, project_id, author_employee_id, is_anonymous, category, title, details, created_at, is_public",
  )
  .eq("project_id", projectId)
  .order("created_at", { ascending: false });
```

**Step 3: Map `is_public` in the `activities` array mapping**

In the `.map(s => ({...}))` block, add:

```ts
isPublic: s.is_public ?? true,
```

**Step 4: Fix TypeScript — update `DUMMY_ACTIVITIES`**

In `activity.ts`, every object in `DUMMY_ACTIVITIES` needs `isPublic: true` added (they're all public dummy data). Do a find-replace: add `isPublic: true,` after each `isLiked:` field.

**Step 5: Commit**

```bash
git add src/lib/constants/activity.ts src/app/actions/projects.ts
git commit -m "feat: add isPublic to ActivityItem and map from signals"
```

---

## Task 5: Update `SignalModal` — `@` mention picker + `is_public` toggle + real action

**Why:** The modal currently uses a `setTimeout` simulation. It needs to connect to `createSignal`, detect `@` in the textarea, show a project employee dropdown, insert mention text, and track `targetEmployeeIds`.

**Files:**
- Modify: `src/components/dashboard/signal-modal.tsx`

**Overview of new state:**
```ts
const [isPublic, setIsPublic] = useState(true);
const [mentionQuery, setMentionQuery] = useState<string | null>(null); // text after '@'
const [mentionAnchor, setMentionAnchor] = useState<number>(0); // cursor position of '@'
const [projectEmployees, setProjectEmployees] = useState<EmployeeRecord[]>([]);
const [taggedEmployees, setTaggedEmployees] = useState<EmployeeRecord[]>([]);
// content: plain text with @[Name](id) tokens
```

**Step 1: Fetch project employees when modal opens**

```ts
useEffect(() => {
  if (!isOpen) return;
  getEmployees({ projectId, onlyActive: true }).then((res) => {
    if (res.status === "success") setProjectEmployees(res.employees);
  });
}, [isOpen, projectId]);
```

**Step 2: Detect `@` in textarea `onChange`**

```ts
function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
  const val = e.target.value;
  setContent(val);

  // Find last '@' before cursor that hasn't been closed by a space
  const cursor = e.target.selectionStart ?? val.length;
  const textBeforeCursor = val.slice(0, cursor);
  const atIndex = textBeforeCursor.lastIndexOf("@");

  if (atIndex !== -1) {
    const query = textBeforeCursor.slice(atIndex + 1);
    // Only show dropdown if no space after '@' (still typing the name)
    if (!query.includes(" ") && !query.includes("\n")) {
      setMentionQuery(query);
      setMentionAnchor(atIndex);
      return;
    }
  }
  setMentionQuery(null);
}
```

**Step 3: Filter employees by `mentionQuery`**

```ts
const mentionResults = mentionQuery !== null
  ? projectEmployees.filter((e) =>
      e.fullName.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5)
  : [];
```

**Step 4: Handle employee selection from dropdown**

```ts
function handleMentionSelect(emp: EmployeeRecord) {
  // Replace '@query' with '@[Full Name](id)' in content
  const before = content.slice(0, mentionAnchor);
  const after = content.slice(mentionAnchor + 1 + (mentionQuery?.length ?? 0));
  setContent(`${before}@[${emp.fullName}](${emp.id})${after}`);

  // Track as tagged
  setTaggedEmployees((prev) =>
    prev.find((e) => e.id === emp.id) ? prev : [...prev, emp]
  );
  setMentionQuery(null);
}
```

**Step 5: `is_public` toggle UI**

Add below the type selector, above the textarea. The label reflects that `@mention` is always tracked — `is_public` only changes who can see it:

```tsx
<div className="px-8 pb-4 flex items-center justify-between">
  <div className="space-y-0.5">
    <p className="font-plus-jakarta text-sm font-bold text-brand-primary">Visibility</p>
    <p className="text-[11px] text-slate-400">
      {isPublic
        ? "Everyone in the project can see this"
        : "@Mentioned people only — others cannot see this"}
    </p>
  </div>
  <button
    type="button"
    onClick={() => setIsPublic(!isPublic)}
    className={cn(
      "relative h-6 w-11 rounded-full transition-colors duration-200",
      isPublic ? "bg-brand-primary" : "bg-slate-200"
    )}
  >
    <span className={cn(
      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
      isPublic ? "translate-x-5" : "translate-x-0.5"
    )} />
  </button>
</div>
```

**Step 6: Connect to `createSignal` via `useActionState`**

Replace the `handlePost` simulation with real form submission:

```tsx
import { useActionState } from "react";
import { createSignal } from "@/app/actions/signals";
import { initialSignalActionState } from "@/app/actions/signal.types";

// Inside component:
const [state, formAction, isPending] = useActionState(createSignal, initialSignalActionState);

// Close on success
useEffect(() => {
  if (state.status === "success") onClose();
}, [state.status]);
```

The textarea and hidden inputs are wrapped in a `<form action={formAction}>`:

```tsx
<form action={formAction}>
  <input type="hidden" name="category" value={selectedType ?? ""} />
  <input type="hidden" name="projectId" value={projectId} />
  <input type="hidden" name="isPublic" value={isPublic ? "on" : ""} />
  {taggedEmployees.map((e) => (
    <input key={e.id} type="hidden" name="targetEmployeeIds[]" value={e.id} />
  ))}
  <input type="hidden" name="title" value={content.slice(0, 100)} />
  {/* textarea for details */}
  <textarea name="details" value={content} onChange={handleContentChange} ... />
  {/* send button: type="submit", disabled={isPending || !content.trim() || !selectedType} */}
</form>
```

> **Note on `title`:** The schema requires a `title` (min 4 chars). Since the modal has no separate title field, derive it from the first 100 chars of `content`. If the content is ≥ 4 chars, this satisfies the schema.

**Step 7: Render `@mention` dropdown above the textarea**

```tsx
{mentionResults.length > 0 && (
  <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden z-10">
    {mentionResults.map((emp) => (
      <button
        key={emp.id}
        type="button"
        onMouseDown={(e) => { e.preventDefault(); handleMentionSelect(emp); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
      >
        <img
          src={`https://i.pravatar.cc/150?u=${encodeURIComponent(emp.email)}`}
          className="h-6 w-6 rounded-full object-cover"
          alt={emp.fullName}
        />
        <div>
          <p className="font-plus-jakarta text-sm font-bold text-brand-primary">{emp.fullName}</p>
          <p className="text-[11px] text-slate-400">{emp.jobPosition}</p>
        </div>
      </button>
    ))}
  </div>
)}
```

**Step 8: Reset all state on close**

```ts
useEffect(() => {
  if (!isOpen) {
    setSelectedType(null);
    setContent("");
    setIsPublic(true);
    setTaggedEmployees([]);
    setMentionQuery(null);
    setProjectEmployees([]);
  }
}, [isOpen]);
```

**Step 9: Commit**

```bash
git add src/components/dashboard/signal-modal.tsx
git commit -m "feat: add @mention picker, is_public toggle, and wire to createSignal action"
```

---

## Task 6: Update `ActivityCard` — private badge + visual differentiation

**Why:** Users need to know at a glance which signals are private (only visible to targets).

**Files:**
- Modify: `src/components/dashboard/activity-card.tsx`

**Step 1: Add `isPublic` to `Props`**

```ts
interface Props {
  activity: ActivityItem;
  index: number;
}
// ActivityItem already has isPublic: boolean after Task 4
```

**Step 2: Add private badge in the card header**

In the header row (after the timestamp), add:

```tsx
{!activity.isPublic && (
  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
    <Lock className="h-2.5 w-2.5" />
    Private
  </span>
)}
```

Import `Lock` from `lucide-react`.

**Step 3: Add subtle left accent border for private signals**

On the outer card `div`, add a conditional class:

```tsx
className={cn(
  "group relative bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-brand-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
  !activity.isPublic && "border-l-4 border-l-slate-200",
)}
```

**Step 4: Commit**

```bash
git add src/components/dashboard/activity-card.tsx
git commit -m "feat: show Private badge and left border accent on private signals"
```

---

## Task 7: Clean up `ProjectDetailClient` — no `authorEmployeeId` prop needed

**Why:** `authorEmployeeId` was previously planned as a prop for `SignalModal` but is now resolved server-side from Clerk. The modal only needs `projectId` and `projectName`.

**Files:**
- Modify: `src/components/dashboard/project-detail-client.tsx`

**Step 1: Verify `SignalModal` props**

Confirm `SignalModal` interface is:
```ts
interface Props {
  isOpen: boolean;
  projectName: string;
  projectId: string;
  onClose: () => void;
}
```

No `authorEmployeeId` prop — it's already correct in the current implementation.

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors surfaced (likely from `isPublic` being added to `ActivityItem` but not yet on `DUMMY_ACTIVITIES` entries — handled in Task 4 Step 4).

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete private signal + @mention targeting feature"
git push origin development
```

---

## Dependency Order

```
Task 1 (getEmployees filter)
  → Task 5 (SignalModal uses getEmployees)

Task 2 (schema)
  → Task 3 (createSignal uses schema)
    → Task 5 (modal calls createSignal)

Task 4 (ActivityItem type + getProjectDetail)
  → Task 6 (ActivityCard uses isPublic)

Task 7 (cleanup) — last, depends on all above
```

Run in order: 1 → 2 → 3 → 4 → 5 → 6 → 7.

---

## How to Test End-to-End

**Scenario A — Public signal with @mention (cc'd)**
1. Open a project detail page → click **+ Signal**
2. Select a signal type, type `@` → select an employee → submit with Visibility ON (public)
3. Supabase `signals`: `is_public = true`
4. Supabase `signal_targets`: one `target_type = 'employee'` row for the mentioned person
5. Feed: card shows normally (no Private badge) — everyone sees it

**Scenario B — Private signal with @mention**
1. Same flow, toggle Visibility OFF (private) before submitting
2. Supabase `signals`: `is_public = false`
3. Supabase `signal_targets`: one `target_type = 'employee'` row per mentioned person
4. Feed: card shows **Private** badge + left border accent

**Scenario C — Public signal, no @mention (fallback)**
1. Write signal without any `@` → submit with Visibility ON
2. Supabase `signal_targets`: one `target_type = 'all'` row (fallback)
