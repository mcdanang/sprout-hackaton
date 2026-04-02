-- ============================================================
-- SPROUT OWNERSHIP PLATFORM — Schema only
-- Tables, indexes, constraints, RLS. Run in Supabase SQL Editor.
-- Optional demo data: run seed.sql after this on a fresh database.
-- ============================================================

-- ============================================================
-- RESET (Rerunnable)
-- ============================================================
-- Safe to run multiple times; drops tables with dependencies.
drop table if exists public.signal_targets cascade;
drop table if exists public.signals cascade;
drop table if exists public.employee_projects cascade;
drop table if exists public.employees cascade;
drop table if exists public.projects cascade;
drop table if exists public.organizations cascade;
drop table if exists public.roles cascade;
drop table if exists public.signal_likes cascade;
drop table if exists public.signal_replies cascade;


-- 1. ORGANIZATIONS
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
create policy "organizations readable by authenticated" on public.organizations
  for select to authenticated using (true);
alter table public.organizations disable row level security;

-- 2. PROJECTS
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  status text not null default 'Development'
    check (status in ('Planning', 'Development', 'UAT', 'Deployment', 'Maintenance')),
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
create policy "projects readable by authenticated" on public.projects
  for select to authenticated using (true);
alter table public.projects disable row level security;

-- 3. ROLES
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.roles enable row level security;
create policy "roles readable by authenticated" on public.roles
  for select to authenticated using (true);
alter table public.roles disable row level security;

-- 4. EMPLOYEES
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  job_position text not null,
  organization_id uuid not null references public.organizations(id),
  role_id uuid not null references public.roles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.employees enable row level security;
create policy "employees readable by authenticated" on public.employees
  for select to authenticated using (true);
create policy "employees can update own profile" on public.employees
  for update to authenticated using (auth.uid() = auth_id);
alter table public.employees disable row level security;

-- 4.0. EMPLOYEE ↔ PROJECT (many-to-many)
create table if not exists public.employee_projects (
  employee_id uuid not null references public.employees(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  primary key (employee_id, project_id)
);

create index if not exists employee_projects_project_id_idx on public.employee_projects(project_id);

alter table public.employee_projects enable row level security;
create policy "employee_projects readable by authenticated" on public.employee_projects
  for select to authenticated using (true);
alter table public.employee_projects disable row level security;

-- 4.1. PROJECT SQUAD LEAD (FK to employees)
alter table public.projects
  add column if not exists squad_lead_employee_id uuid
  references public.employees(id) on delete set null;
create index if not exists projects_squad_lead_employee_id_idx
  on public.projects(squad_lead_employee_id);

-- 5. SIGNALS
create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),

  author_employee_id uuid not null
    references public.employees(id) on delete cascade,

  is_anonymous boolean not null default false,
  category text not null check (category in ('concern', 'achievement', 'appreciation')),
  title text not null,
  details text not null,
  sentiment_score int check (sentiment_score between 0 and 100),
  ai_issue_category text check (
    ai_issue_category in (
      'Burnout Alert',
      'Scope Creep',
      'Process Bottleneck',
      'Communication Gap',
      'Technical Debt',
      'Micro-management',
      'Professional Growth',
      'Office Environment',
      'others'
    )
  ),

  project_id uuid references public.projects(id) on delete set null,
  is_public boolean not null default false,

  concern_status text check (
    concern_status is null or concern_status in ('open', 'in_progress', 'closed')
  ),

  created_at timestamptz not null default now()
);

create index if not exists signals_project_id_idx on public.signals(project_id);
create index if not exists signals_created_at_idx on public.signals(created_at desc);

-- Backward-compatible in case table already exists in an environment.
alter table public.signals add column if not exists sentiment_score int;
alter table public.signals add column if not exists ai_issue_category text;
alter table public.signals add column if not exists concern_status text;
alter table public.signals drop constraint if exists signals_concern_status_check;
alter table public.signals add constraint signals_concern_status_check check (
  concern_status is null or concern_status in ('open', 'in_progress', 'closed')
);
alter table public.signals drop constraint if exists signals_sentiment_score_check;
alter table public.signals add constraint signals_sentiment_score_check
  check (sentiment_score between 0 and 100);
alter table public.signals drop constraint if exists signals_ai_issue_category_check;
alter table public.signals add constraint signals_ai_issue_category_check
  check (
    ai_issue_category in (
      'Burnout Alert',
      'Scope Creep',
      'Process Bottleneck',
      'Communication Gap',
      'Technical Debt',
      'Micro-management',
      'Professional Growth',
      'Office Environment',
      'others'
    )
  );

alter table public.signals enable row level security;
create policy "signals readable by authenticated" on public.signals
  for select to authenticated using (true);
alter table public.signals disable row level security;

-- 6. SIGNAL TARGETS
create table if not exists public.signal_targets (
  id uuid primary key default gen_random_uuid(),

  signal_id uuid not null
    references public.signals(id) on delete cascade,

  target_type text not null check (target_type in ('all', 'role', 'employee', 'organization')),
  target_role_id uuid references public.roles(id) on delete set null,
  target_employee_id uuid references public.employees(id) on delete set null,
  target_organization_id uuid references public.organizations(id) on delete set null,

  created_at timestamptz not null default now(),

  -- Basic consistency rules between target_type and the provided target ids
  constraint signal_targets_target_consistency check (
    (target_type = 'all' and target_role_id is null and target_employee_id is null and target_organization_id is null)
    or (target_type = 'role' and target_role_id is not null and target_employee_id is null and target_organization_id is null)
    or (target_type = 'employee' and target_role_id is null and target_employee_id is not null and target_organization_id is null)
    or (target_type = 'organization' and target_role_id is null and target_employee_id is null and target_organization_id is not null)
  )
);

create index if not exists signal_targets_signal_id_idx on public.signal_targets(signal_id);
create index if not exists signal_targets_target_role_id_idx on public.signal_targets(target_role_id);
create index if not exists signal_targets_target_employee_id_idx on public.signal_targets(target_employee_id);
create index if not exists signal_targets_target_organization_id_idx on public.signal_targets(target_organization_id);

-- Backward-compatible: widen target_type + add organization column on existing DBs.
alter table public.signal_targets add column if not exists target_organization_id uuid references public.organizations(id) on delete set null;
alter table public.signal_targets drop constraint if exists signal_targets_target_type_check;
alter table public.signal_targets add constraint signal_targets_target_type_check
  check (target_type in ('all', 'role', 'employee', 'organization'));
alter table public.signal_targets drop constraint if exists signal_targets_target_consistency;
alter table public.signal_targets add constraint signal_targets_target_consistency check (
  (target_type = 'all' and target_role_id is null and target_employee_id is null and target_organization_id is null)
  or (target_type = 'role' and target_role_id is not null and target_employee_id is null and target_organization_id is null)
  or (target_type = 'employee' and target_role_id is null and target_employee_id is not null and target_organization_id is null)
  or (target_type = 'organization' and target_role_id is null and target_employee_id is null and target_organization_id is not null)
);

alter table public.signal_targets enable row level security;
create policy "signal_targets readable by authenticated" on public.signal_targets
  for select to authenticated using (true);
alter table public.signal_targets disable row level security;

-- 7. SIGNAL LIKES + REPLIES
-- These power the Project feed actions (like/unlike + reply).

-- 7.1 SIGNAL LIKES
create table if not exists public.signal_likes (
  id uuid primary key default gen_random_uuid(),

  signal_id uuid not null
    references public.signals(id) on delete cascade,

  author_employee_id uuid not null
    references public.employees(id) on delete cascade,

  created_at timestamptz not null default now(),

  constraint signal_likes_unique_pair unique (signal_id, author_employee_id)
);

create index if not exists signal_likes_signal_id_idx on public.signal_likes(signal_id);
create index if not exists signal_likes_author_employee_id_idx on public.signal_likes(author_employee_id);

alter table public.signal_likes enable row level security;
create policy "signal_likes readable by authenticated" on public.signal_likes
  for select to authenticated using (true);
create policy "signal_likes insertable by authenticated" on public.signal_likes
  for insert to authenticated with check (true);
create policy "signal_likes deletable by authenticated" on public.signal_likes
  for delete to authenticated using (true);
alter table public.signal_likes disable row level security;

-- 7.2 SIGNAL REPLIES
create table if not exists public.signal_replies (
  id uuid primary key default gen_random_uuid(),

  signal_id uuid not null
    references public.signals(id) on delete cascade,

  author_employee_id uuid not null
    references public.employees(id) on delete cascade,

  content text not null,

  created_at timestamptz not null default now()
);

create index if not exists signal_replies_signal_id_idx on public.signal_replies(signal_id);
create index if not exists signal_replies_author_employee_id_idx on public.signal_replies(author_employee_id);
create index if not exists signal_replies_created_at_idx on public.signal_replies(created_at desc);

alter table public.signal_replies enable row level security;
create policy "signal_replies readable by authenticated" on public.signal_replies
  for select to authenticated using (true);
create policy "signal_replies insertable by authenticated" on public.signal_replies
  for insert to authenticated with check (true);
alter table public.signal_replies disable row level security;

