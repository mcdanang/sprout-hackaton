-- One-time migration: move employees.project_id → public.employee_projects (many-to-many).
-- Safe to run on fresh DBs (no-op if column already removed). Run after creating employee_projects.

create table if not exists public.employee_projects (
  employee_id uuid not null references public.employees(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  primary key (employee_id, project_id)
);

create index if not exists employee_projects_project_id_idx on public.employee_projects(project_id);

alter table public.employee_projects enable row level security;
drop policy if exists "employee_projects readable by authenticated" on public.employee_projects;
create policy "employee_projects readable by authenticated" on public.employee_projects
  for select to authenticated using (true);
alter table public.employee_projects disable row level security;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employees'
      and column_name = 'project_id'
  ) then
    insert into public.employee_projects (employee_id, project_id)
    select id, project_id
    from public.employees
    where project_id is not null
    on conflict (employee_id, project_id) do nothing;

    alter table public.employees drop column project_id;
  end if;
end $$;
