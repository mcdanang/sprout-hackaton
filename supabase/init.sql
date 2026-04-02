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

-- 2. PROJECTS
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
create policy "projects readable by authenticated" on public.projects
  for select to authenticated using (true);

-- 3. EMPLOYEES
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text unique,
  job_position text not null,
  organization_id uuid not null references public.organizations(id),
  project_id uuid not null references public.projects(id),
  role text not null default 'employee' check (role in ('employee', 'manager', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.employees enable row level security;
create policy "employees readable by authenticated" on public.employees
  for select to authenticated using (true);
create policy "employees can update own profile" on public.employees
  for update to authenticated using (auth.uid() = auth_id);


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

-- Employees
insert into public.employees (full_name, job_position, organization_id, project_id) values
  -- CEO
  ('Egg Arnold Sebastian',                        'CEO',                                  (select id from public.organizations where name = 'CEO'),               (select id from public.projects where name = 'SPROUT')),

  -- HR/GA
  ('Angelina Kesya Christinatalia',               'HR Officer',                           (select id from public.organizations where name = 'HR/GA'),             (select id from public.projects where name = 'SPROUT')),
  ('Christina Devi Ariyani',                      'Office Manager',                       (select id from public.organizations where name = 'HR/GA'),             (select id from public.projects where name = 'SPROUT')),
  ('Rebecca Deborah Aritonang',                   'Legal Officer',                        (select id from public.organizations where name = 'HR/GA'),             (select id from public.projects where name = 'SPROUT')),
  ('Sukardi',                                     'Finance & Accounting',                 (select id from public.organizations where name = 'HR/GA'),             (select id from public.projects where name = 'SPROUT')),
  ('Patricia Timothy',                            'HR Officer',                           (select id from public.organizations where name = 'HR/GA'),             (select id from public.projects where name = 'SPROUT')),

  -- Sales
  ('Gilang Satrya Putra',                         'Admin Staff Coordinator',              (select id from public.organizations where name = 'Sales'),             (select id from public.projects where name = 'SPROUT')),
  ('Vania Aribowo',                               'Business Development Manager',         (select id from public.organizations where name = 'Sales'),             (select id from public.projects where name = 'SPROUT')),
  ('Sanny Martin',                                'Head of Sales',                        (select id from public.organizations where name = 'Sales'),             (select id from public.projects where name = 'SPROUT')),
  ('Sakti Ambawani',                              'Business Development Manager',         (select id from public.organizations where name = 'Sales'),             (select id from public.projects where name = 'SPROUT')),

  -- Product
  ('Alistair Tody',                               'Business & Strategic Development Lead',(select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'HI-FELLA')),
  ('Nathanneal Audris',                           'Project Manager',                      (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'KHONIC')),
  ('Lamhot Pardamean Siahaan',                    'Junior Technical Product',             (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'SMARCO')),
  ('Tjiong Teguh Arianto',                        'Sr Product Manager',                   (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'LABAMU SINGAPORE')),
  ('Marlon P V M Keintjem',                       'VP of Product',                        (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'SPROUT')),
  ('Briyan Benget Alfonsius',                     'Product Manager Support',              (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'HI-FELLA')),
  ('Eldaa Warapsari',                             'Product Manager Officer',              (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'SPROUT')),
  ('Reynaldo Damara Salim',                       'Associate Product Manager',            (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'BOUCHON')),
  ('Shafa Matahati',                              'Jr Product Manager',                   (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'JAPFA')),
  ('Grisviany',                                   'Product Manager',                      (select id from public.organizations where name = 'Product'),           (select id from public.projects where name = 'LABAMU SINGAPORE')),

  -- UI/UX
  ('Vanessa Gunawan',                             'UI/UX Designer Lead',                  (select id from public.organizations where name = 'UI/UX'),             (select id from public.projects where name = 'SPROUT')),
  ('Moch Baiz Kamarulredzuan',                    'Jr UI/UX Designer',                    (select id from public.organizations where name = 'UI/UX'),             (select id from public.projects where name = 'TOCO')),
  ('Darren Ekaseptian',                           'UI/UX Designer',                       (select id from public.organizations where name = 'UI/UX'),             (select id from public.projects where name = 'JAPFA')),
  ('Bimo Prayogo Muhammad',                       'UI/UX Designer',                       (select id from public.organizations where name = 'UI/UX'),             (select id from public.projects where name = 'BOUCHON')),
  ('Glenn Vhalado Dykaputra L. Toruan',           'UI/UX Designer',                       (select id from public.organizations where name = 'UI/UX'),             (select id from public.projects where name = 'SPECTRA')),

  -- Quality Assurance
  ('Wirapa Pillay',                               'VP of Quality Assurance',              (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'SPROUT')),
  ('Devi Rahmawati',                              'QA Engineer Associate',                (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'JAPFA')),
  ('Sangan Nathan',                               'QA Lead',                              (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'SPROUT')),
  ('Triisya Velly',                               'QA Engineer Associate',                (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'JAPFA')),
  ('Rahadiyan Koesandrianto',                     'QA Engineer (Associate)',              (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'LABAMU SINGAPORE')),
  ('Dian Marsha Putri',                           'Sr QA Engineer',                       (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'LABAMU SINGAPORE')),
  ('Muhammad Raihan Mubaroq',                     'QA Engineer Junior',                   (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'LABAMU SINGAPORE')),
  ('Leni Hendra',                                 'QA Engineer Associate',                (select id from public.organizations where name = 'Quality Assurance'), (select id from public.projects where name = 'QINERJA')),

  -- Tech
  ('Heri Herlambang Lumanto',                     'IT System Admin',                      (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'SPROUT')),
  ('Maya Andira',                                 'Scrum Master',                         (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU')),
  ('Muh Syaipullah',                              'SRE',                                  (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'TOCO')),
  ('Muhammad Firza',                              'Data Engineer',                        (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'EDOTCO')),
  ('Ugan Saripudin',                              'Tech Lead',                            (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU')),
  ('Faisal Ariyanto',                             'Team Lead',                            (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'ALODOKTER')),
  ('Kevin Godrikus Archibald Tagading P',         'Team Lead',                            (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'HI-FELLA')),
  ('Muhammad Azki Darmawan',                      'Tech Lead',                            (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'SPROUT')),
  ('Bagus Kurnianto',                             'Lead Mobile Developer',                (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU SINGAPORE')),
  ('Valentinus Hendy Odwin Santoso',              'Sr. Mobile Developer',                 (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU SINGAPORE')),
  ('David Santoso',                               'Mobile Developer',                     (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU')),
  ('Ibnu Triyardi Muda',                          'Sr. Mobile Developer',                 (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU')),
  ('Sesaka Aji Nursah Bantani',                   'Jr Mobile Developer',                  (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'KHONIC')),
  ('Jaka Hajar Wiguna',                           'Mobile Developer',                     (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'QINERJA')),
  ('Zikry Kurniawan',                             'Sr. Backend Engineer',                 (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU')),
  ('Alda Delas',                                  'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU SINGAPORE')),
  ('Bintang Muhammad Wahid',                      'Backend Engineer',                     (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'SMARCO')),
  ('Fakhrul Muhammad Rijal',                      'Backend Engineer',                     (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'SPECTRA')),
  ('Teddy Adji Pangestu',                         'Frontend Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU')),
  ('Gaizka Valencia',                             'Jr. Software Engineer',                (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU')),
  ('Fian Febry Ispianto',                         'Frontend Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON')),
  ('Farid Nugroho',                               'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU')),
  ('Al Fatih Abdurrahman Syah',                   'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU')),
  ('Mahar Prasetio',                              'Sr. Fullstack Engineer',               (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON')),
  ('Pradytia Herlyansah',                         'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU')),
  ('Irwin Pratajaya',                             'Sr. Software Engineer',                (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'JAPFA')),
  ('Muhamad Danang Priambodo',                    'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON')),
  ('Rizky Maulita Putri',                         'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON')),
  ('Ryan Apratama',                               'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON')),
  ('Marcellus Denta Widyapramana',                'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'LABAMU SINGAPORE')),
  ('Fawaz',                                       'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON')),
  ('Yusuf Farhan Abdullah',                       'Software Engineer',                    (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'JAPFA')),
  ('Herjuno Pangestu',                            'DevOps',                               (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON')),
  ('Ahmad Dhiya Ilmam Putra',                     'Jr DevOps',                            (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'QINERJA')),
  ('Harun Arasyid',                               'Sr DevOps',                            (select id from public.organizations where name = 'Tech'),              (select id from public.projects where name = 'BOUCHON'));
