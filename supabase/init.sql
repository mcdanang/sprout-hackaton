-- ============================================================
-- SPROUT OWNERSHIP PLATFORM — Schema
-- Run this in Supabase SQL Editor (top to bottom).
-- ============================================================

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
  project_id uuid not null references public.projects(id),
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

-- 5. SIGNALS
create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),

  author_employee_id uuid not null
    references public.employees(id) on delete cascade,

  is_anonymous boolean not null default false,
  category text not null check (category in ('concern', 'achievement', 'appreciation')),
  title text not null,
  details text not null,

  project_id uuid references public.projects(id) on delete set null,
  is_public boolean not null default false,

  created_at timestamptz not null default now()
);

create index if not exists signals_project_id_idx on public.signals(project_id);
create index if not exists signals_created_at_idx on public.signals(created_at desc);

alter table public.signals enable row level security;
create policy "signals readable by authenticated" on public.signals
  for select to authenticated using (true);
alter table public.signals disable row level security;

-- 6. SIGNAL TARGETS
create table if not exists public.signal_targets (
  id uuid primary key default gen_random_uuid(),

  signal_id uuid not null
    references public.signals(id) on delete cascade,

  target_type text not null check (target_type in ('all', 'role', 'employee')),
  target_role_id uuid references public.roles(id) on delete set null,
  target_employee_id uuid references public.employees(id) on delete set null,

  created_at timestamptz not null default now(),

  -- Basic consistency rules between target_type and the provided target ids
  constraint signal_targets_target_consistency check (
    (target_type = 'all' and target_role_id is null and target_employee_id is null)
    or (target_type = 'role' and target_role_id is not null and target_employee_id is null)
    or (target_type = 'employee' and target_role_id is null and target_employee_id is not null)
  )
);

create index if not exists signal_targets_signal_id_idx on public.signal_targets(signal_id);
create index if not exists signal_targets_target_role_id_idx on public.signal_targets(target_role_id);
create index if not exists signal_targets_target_employee_id_idx on public.signal_targets(target_employee_id);

alter table public.signal_targets enable row level security;
create policy "signal_targets readable by authenticated" on public.signal_targets
  for select to authenticated using (true);
alter table public.signal_targets disable row level security;


-- ============================================================
-- SEED DATA
-- ============================================================

-- Organizations
insert into public.organizations (name) values
  ('CEO'),
  ('HR/GA'),
  ('Sales'),
  ('Product'),
  ('UI/UX'),
  ('Quality Assurance'),
  ('Tech')
on conflict (name) do nothing;

-- Projects
insert into public.projects (name) values
  ('SPROUT'),
  ('HI-FELLA'),
  ('KHONIC'),
  ('SMARCO'),
  ('LABAMU SINGAPORE'),
  ('BOUCHON'),
  ('JAPFA'),
  ('TOCO'),
  ('SPECTRA'),
  ('QINERJA'),
  ('LABAMU'),
  ('EDOTCO'),
  ('ALODOKTER')
on conflict (name) do nothing;

-- Roles
insert into public.roles (name) values
  ('TOP MANAGEMENT'),
  ('SQUAD LEAD'),
  ('STAFF')
on conflict (name) do nothing;

-- Employees (full_name, email, job_position, organization, project, role)
-- Omitted from seed (no email provided): Muh Syaipullah, Ibnu Triyardi Muda, Farid Nugroho, Pradytia Herlyansah
insert into public.employees (full_name, email, job_position, organization_id, project_id, role_id) values
  -- CEO
  ('Egg Arnold Sebastian',                        'arnold.sebastian@sprout.co.id',        'CEO',                                  (select id from public.organizations where name = 'CEO'),               (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'TOP MANAGEMENT')),

  -- HR/GA
  ('Angelina Kesya Christinatalia',               'angelina.kesya@sprout.co.id',          'HR Officer',                           (select id from public.organizations where name = 'HR/GA'),             (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Christina Devi Ariyani',                      'christina.devi@sprout.co.id',          'Office Manager',                       (select id from public.organizations where name = 'HR/GA'),             (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Rebecca Deborah Aritonang',                   'rebecca.deborah@sprout.co.id',         'Legal Officer',                        (select id from public.organizations where name = 'HR/GA'),             (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Sukardi',                                     'sukardi@sprout.co.id',                 'Finance & Accounting',                 (select id from public.organizations where name = 'HR/GA'),             (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Patricia Timothy',                            'patricia.timothy@sprout.co.id',        'HR Officer',                           (select id from public.organizations where name = 'HR/GA'),             (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'TOP MANAGEMENT')),

  -- Sales
  ('Gilang Satrya Putra',                         'gilang.satrya@sprout.co.id',           'Admin Staff Coordinator',              (select id from public.organizations where name = 'Sales'),             (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Vania Aribowo',                               'vania.aribowo@sprout.co.id',           'Business Development Manager',         (select id from public.organizations where name = 'Sales'),             (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Sanny Martin',                                'sanny.martin@sprout.co.id',            'Head of Sales',                        (select id from public.organizations where name = 'Sales'),             (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Sakti Ambawani',                              'sakti.ambawani@sprout.co.id',          'Business Development Manager',         (select id from public.organizations where name = 'Sales'),             (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'TOP MANAGEMENT')),

  -- Product
  ('Alistair Tody',                               'alistair.tody@sprout.co.id',           'Business & Strategic Development Lead',(select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'HI-FELLA'),        (select id from public.roles where name = 'SQUAD LEAD')),
  ('Nathanneal Audris',                           'nathanneal.audris@sprout.co.id',       'Project Manager',                      (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'KHONIC'),          (select id from public.roles where name = 'STAFF')),
  ('Lamhot Pardamean Siahaan',                    'lamhot.siahaan@sprout.co.id',          'Junior Technical Product',             (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'SMARCO'),          (select id from public.roles where name = 'STAFF')),
  ('Tjiong Teguh Arianto',                        'teguh.arianto@sprout.co.id',           'Sr Product Manager',                   (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'LABAMU SINGAPORE'),(select id from public.roles where name = 'SQUAD LEAD')),
  ('Marlon P V M Keintjem',                       'marlon.keintjem@sprout.co.id',        'VP of Product',                        (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Briyan Benget Alfonsius',                     'briyan.benget@sprout.co.id',           'Product Manager Support',              (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'HI-FELLA'),        (select id from public.roles where name = 'SQUAD LEAD')),
  ('Eldaa Warapsari',                             'eldaa.warapsari@sprout.co.id',         'Product Manager Officer',              (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'SQUAD LEAD')),
  ('Reynaldo Damara Salim',                       'reynaldo.damara@sprout.co.id',         'Associate Product Manager',            (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'BOUCHON'),         (select id from public.roles where name = 'SQUAD LEAD')),
  ('Shafa Matahati',                              'shafa.matahati@sprout.co.id',          'Jr Product Manager',                   (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'JAPFA'),           (select id from public.roles where name = 'SQUAD LEAD')),
  ('Grisviany',                                   'grisviany@sprout.co.id',               'Product Manager',                      (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'LABAMU SINGAPORE'),(select id from public.roles where name = 'STAFF')),

  -- UI/UX
  ('Vanessa Gunawan',                             'vanessa.gunawan@sprout.co.id',         'UI/UX Designer Lead',                  (select id from public.organizations where name = 'UI/UX'),             (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'SQUAD LEAD')),
  ('Moch Baiz Kamarulredzuan',                    'moch.baiz@sprout.co.id',               'Jr UI/UX Designer',                    (select id from public.organizations where name = 'UI/UX'),             (select id from public.projects where name = 'TOCO'),            (select id from public.roles where name = 'STAFF')),
  ('Darren Ekaseptian',                           'darren.ekaseptian@sprout.co.id',       'UI/UX Designer',                       (select id from public.organizations where name = 'UI/UX'),             (select id from public.projects where name = 'JAPFA'),           (select id from public.roles where name = 'STAFF')),
  ('Bimo Prayogo Muhammad',                       'bimo.prayogo@sprout.co.id',            'UI/UX Designer',                       (select id from public.organizations where name = 'UI/UX'),             (select id from public.projects where name = 'BOUCHON'),         (select id from public.roles where name = 'STAFF')),
  ('Glenn Vhalado Dykaputra L. Toruan',           'glenn.vhalado@sprout.co.id',           'UI/UX Designer',                       (select id from public.organizations where name = 'UI/UX'),             (select id from public.projects where name = 'SPECTRA'),         (select id from public.roles where name = 'STAFF')),

  -- Quality Assurance
  ('Wirapa Pillay',                               'wirapa.pillay@sprout.co.id',           'VP of Quality Assurance',              (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'SQUAD LEAD')),
  ('Devi Rahmawati',                              'devi.rahmawati@sprout.co.id',          'QA Engineer Associate',                (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'JAPFA'),           (select id from public.roles where name = 'STAFF')),
  ('Sangan Nathan',                               'sangan.nathan@sprout.co.id',           'QA Lead',                              (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'STAFF')),
  ('Triisya Velly',                               'triisya.velly@sprout.co.id',           'QA Engineer Associate',                (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'JAPFA'),           (select id from public.roles where name = 'STAFF')),
  ('Rahadiyan Koesandrianto',                     'rahadiyan.koesandrianto@sprout.co.id', 'QA Engineer (Associate)',              (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'LABAMU SINGAPORE'),(select id from public.roles where name = 'STAFF')),
  ('Dian Marsha Putri',                           'dian.marsha@sprout.co.id',             'Sr QA Engineer',                       (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'LABAMU SINGAPORE'),(select id from public.roles where name = 'STAFF')),
  ('Muhammad Raihan Mubaroq',                     'muhammad.raihan@sprout.co.id',         'QA Engineer Junior',                   (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'LABAMU SINGAPORE'),(select id from public.roles where name = 'STAFF')),
  ('Leni Hendra',                                 'leni.hendra@sprout.co.id',             'QA Engineer Associate',                (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'QINERJA'),         (select id from public.roles where name = 'STAFF')),

  -- Tech
  ('Heri Herlambang Lumanto',                     'heri.herlambang@sprout.co.id',         'IT System Admin',                      (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'STAFF')),
  ('Maya Andira',                                 'maya.andira@sprout.co.id',             'Scrum Master',                         (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU'),          (select id from public.roles where name = 'STAFF')),
  ('Muhammad Firza',                              'muhammad.firza@sprout.co.id',          'Data Engineer',                        (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'EDOTCO'),          (select id from public.roles where name = 'STAFF')),
  ('Ugan Saripudin',                              'ugan.saripudin@sprout.co.id',          'Tech Lead',                            (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU'),          (select id from public.roles where name = 'SQUAD LEAD')),
  ('Faisal Ariyanto',                             'faisal.ariyanto@sprout.co.id',         'Team Lead',                            (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'ALODOKTER'),       (select id from public.roles where name = 'SQUAD LEAD')),
  ('Kevin Godrikus Archibald Tagading P',         'kevin.gading@sprout.co.id',            'Team Lead',                            (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'HI-FELLA'),        (select id from public.roles where name = 'STAFF')),
  ('Muhammad Azki Darmawan',                      'azki.darmawan@sprout.co.id',           'Tech Lead',                            (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'SPROUT'),          (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Bagus Kurnianto',                             'bagus.kurnianto@sprout.co.id',         'Lead Mobile Developer',                (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU SINGAPORE'),(select id from public.roles where name = 'STAFF')),
  ('Valentinus Hendy Odwin Santoso',              'hendy.odwin@sprout.co.id',             'Sr. Mobile Developer',                 (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU SINGAPORE'),(select id from public.roles where name = 'STAFF')),
  ('David Santoso',                               'david.santoso@sprout.co.id',           'Mobile Developer',                     (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU'),          (select id from public.roles where name = 'STAFF')),
  ('Sesaka Aji Nursah Bantani',                   'sesaka.aji@sprout.co.id',              'Jr Mobile Developer',                  (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'KHONIC'),          (select id from public.roles where name = 'STAFF')),
  ('Jaka Hajar Wiguna',                           'jaka.hajar@sprout.co.id',              'Mobile Developer',                     (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'QINERJA'),         (select id from public.roles where name = 'STAFF')),
  ('Zikry Kurniawan',                             'zikry.kurniawan@sprout.co.id',         'Sr. Backend Engineer',                 (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU'),          (select id from public.roles where name = 'STAFF')),
  ('Alda Delas',                                  'alda.delas@sprout.co.id',              'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU SINGAPORE'),(select id from public.roles where name = 'STAFF')),
  ('Bintang Muhammad Wahid',                      'bintang.muhammad@sprout.co.id',        'Backend Engineer',                     (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'SMARCO'),          (select id from public.roles where name = 'STAFF')),
  ('Fakhrul Muhammad Rijal',                      'fakhrul.rijal@sprout.co.id',           'Backend Engineer',                     (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'SPECTRA'),         (select id from public.roles where name = 'STAFF')),
  ('Teddy Adji Pangestu',                         'teddy.adji@sprout.co.id',              'Frontend Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU'),          (select id from public.roles where name = 'STAFF')),
  ('Gaizka Valencia',                             'gaizka.valencia@sprout.co.id',         'Jr. Software Engineer',                (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU'),          (select id from public.roles where name = 'STAFF')),
  ('Fian Febry Ispianto',                         'fian.febry@sprout.co.id',              'Frontend Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON'),         (select id from public.roles where name = 'STAFF')),
  ('Al Fatih Abdurrahman Syah',                   'al.fatih@sprout.co.id',                'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU'),          (select id from public.roles where name = 'STAFF')),
  ('Mahar Prasetio',                              'mahar.prasetio@sprout.co.id',          'Sr. Fullstack Engineer',               (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON'),         (select id from public.roles where name = 'STAFF')),
  ('Irwin Pratajaya',                             'irwin.pratajaya@sprout.co.id',         'Sr. Software Engineer',                (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'JAPFA'),           (select id from public.roles where name = 'STAFF')),
  ('Muhamad Danang Priambodo',                    'muhamad.danang@sprout.co.id',          'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON'),         (select id from public.roles where name = 'STAFF')),
  ('Rizky Maulita Putri',                         'rizky.maulita@sprout.co.id',           'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON'),         (select id from public.roles where name = 'STAFF')),
  ('Ryan Apratama',                               'ryan.apratama@sprout.co.id',           'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON'),         (select id from public.roles where name = 'STAFF')),
  ('Marcellus Denta Widyapramana',                'marcellus.denta@sprout.co.id',         'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU SINGAPORE'),(select id from public.roles where name = 'STAFF')),
  ('Fawaz',                                       'fawaz.hustomi@sprout.co.id',           'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON'),         (select id from public.roles where name = 'STAFF')),
  ('Yusuf Farhan Abdullah',                       'yusuf.farhan@sprout.co.id',            'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'JAPFA'),           (select id from public.roles where name = 'STAFF')),
  ('Herjuno Pangestu',                            'herjuno.pangestu@sprout.co.id',        'DevOps',                               (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON'),         (select id from public.roles where name = 'STAFF')),
  ('Ahmad Dhiya Ilmam Putra',                     'ahmad.dhiya@sprout.co.id',             'Jr DevOps',                            (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'QINERJA'),         (select id from public.roles where name = 'STAFF')),
  ('Harun Arasyid',                               'harun.arasyid@sprout.co.id',           'Sr DevOps',                            (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON'),         (select id from public.roles where name = 'STAFF'));
