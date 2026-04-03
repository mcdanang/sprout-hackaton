-- ============================================================
-- SPROUT OWNERSHIP PLATFORM — Seed data (optional)
-- Run after init.sql. Truncates app tables below, then inserts seed rows.
-- WARNING: Destroys all data in these tables. Use dev/staging or intentional re-seed.
-- ============================================================

-- Empty tables (FK-safe: children first; clear squad lead before employees)
truncate table
  public.signal_targets,
  public.signal_replies,
  public.signal_likes,
  public.signals,
  public.employee_projects
restart identity cascade;

update public.projects set squad_lead_employee_id = null;

truncate table
  public.employees,
  public.projects,
  public.organizations,
  public.roles
restart identity cascade;

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
insert into public.projects (name, description, status) values
  ('SPROUT', 'Sprout project', 'Development'),
  ('HI-FELLA', 'HI-FELLA project', 'Development'),
  ('KHONIC', 'KHONIC project', 'Development'),
  ('SMARCO', 'SMARCO project', 'Development'),
  ('LABAMU SINGAPORE', 'LABAMU SINGAPORE project', 'Development'),
  ('BOUCHON', 'BOUCHON project', 'Development'),
  ('JAPFA', 'JAPFA project', 'Development'),
  ('TOCO', 'TOCO project', 'Development'),
  ('SPECTRA', 'SPECTRA project', 'Development'),
  ('QINERJA', 'QINERJA project', 'Development'),
  ('LABAMU', 'LABAMU project', 'Development'),
  ('EDOTCO', 'EDOTCO project', 'Development'),
  ('ALODOKTER', 'Alodokter project', 'Development'),
  ('Hackathon Signal', 'Internal hackathon project for building the Sprout ownership signal platform.', 'Development')
on conflict (name) do nothing;

-- Roles
insert into public.roles (name) values
  ('TOP MANAGEMENT'),
  ('SQUAD LEAD'),
  ('STAFF')
on conflict (name) do nothing;

-- Employees (full_name, email, job_position, organization, role)
-- Project assignments are seeded in employee_projects (many-to-many).
-- Omitted from seed (no email provided): Muh Syaipullah, Ibnu Triyardi Muda, Farid Nugroho, Pradytia Herlyansah
insert into public.employees (full_name, email, job_position, organization_id, role_id) values
  -- CEO
  ('Egg Arnold Sebastian',                        'arnold.sebastian@sprout.co.id',        'CEO',                                  (select id from public.organizations where name = 'CEO'), (select id from public.roles where name = 'TOP MANAGEMENT')),

  -- HR/GA
  ('Angelina Kesya Christinatalia',               'angelina.kesya@sprout.co.id',          'HR Officer',                           (select id from public.organizations where name = 'HR/GA'), (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Christina Devi Ariyani',                      'christina.devi@sprout.co.id',          'Office Manager',                       (select id from public.organizations where name = 'HR/GA'), (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Rebecca Deborah Aritonang',                   'rebecca.deborah@sprout.co.id',         'Legal Officer',                        (select id from public.organizations where name = 'HR/GA'), (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Sukardi',                                     'sukardi@sprout.co.id',                 'Finance & Accounting',                 (select id from public.organizations where name = 'HR/GA'), (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Patricia Timothy',                            'patricia.timothy@sprout.co.id',        'HR Officer',                           (select id from public.organizations where name = 'HR/GA'), (select id from public.roles where name = 'TOP MANAGEMENT')),

  -- Sales
  ('Gilang Satrya Putra',                         'gilang.satrya@sprout.co.id',           'Admin Staff Coordinator',              (select id from public.organizations where name = 'Sales'), (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Vania Aribowo',                               'vania.aribowo@sprout.co.id',           'Business Development Manager',         (select id from public.organizations where name = 'Sales'), (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Sanny Martin',                                'sanny.martin@sprout.co.id',            'Head of Sales',                        (select id from public.organizations where name = 'Sales'), (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Sakti Ambawani',                              'sakti.ambawani@sprout.co.id',          'Business Development Manager',         (select id from public.organizations where name = 'Sales'), (select id from public.roles where name = 'TOP MANAGEMENT')),

  -- Product
  ('Alistair Tody',                               'alistair.tody@sprout.co.id',           'Business & Strategic Development Lead',(select id from public.organizations where name = 'Product'), (select id from public.roles where name = 'SQUAD LEAD')),
  ('Nathanneal Audris',                           'nathanneal.audris@sprout.co.id',       'Project Manager',                      (select id from public.organizations where name = 'Product'), (select id from public.roles where name = 'STAFF')),
  ('Lamhot Pardamean Siahaan',                    'lamhot.siahaan@sprout.co.id',          'Junior Technical Product',             (select id from public.organizations where name = 'Product'), (select id from public.roles where name = 'STAFF')),
  ('Tjiong Teguh Arianto',                        'teguh.arianto@sprout.co.id',           'Sr Product Manager',                   (select id from public.organizations where name = 'Product'), (select id from public.roles where name = 'SQUAD LEAD')),
  ('Marlon P V M Keintjem',                       'marlon.keintjem@sprout.co.id',        'VP of Product',                        (select id from public.organizations where name = 'Product'), (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Briyan Benget Alfonsius',                     'briyan.benget@sprout.co.id',           'Product Manager Support',              (select id from public.organizations where name = 'Product'), (select id from public.roles where name = 'SQUAD LEAD')),
  ('Eldaa Warapsari',                             'eldaa.warapsari@sprout.co.id',         'Product Manager Officer',              (select id from public.organizations where name = 'Product'), (select id from public.roles where name = 'SQUAD LEAD')),
  ('Reynaldo Damara Salim',                       'reynaldo.damara@sprout.co.id',         'Associate Product Manager',            (select id from public.organizations where name = 'Product'), (select id from public.roles where name = 'SQUAD LEAD')),
  ('Shafa Matahati',                              'shafa.matahati@sprout.co.id',          'Jr Product Manager',                   (select id from public.organizations where name = 'Product'), (select id from public.roles where name = 'SQUAD LEAD')),
  ('Grisviany',                                   'grisviany@sprout.co.id',               'Product Manager',                      (select id from public.organizations where name = 'Product'), (select id from public.roles where name = 'STAFF')),

  -- UI/UX
  ('Vanessa Gunawan',                             'vanessa.gunawan@sprout.co.id',         'UI/UX Designer Lead',                  (select id from public.organizations where name = 'UI/UX'), (select id from public.roles where name = 'SQUAD LEAD')),
  ('Moch Baiz Kamarulredzuan',                    'moch.baiz@sprout.co.id',               'Jr UI/UX Designer',                    (select id from public.organizations where name = 'UI/UX'), (select id from public.roles where name = 'STAFF')),
  ('Darren Ekaseptian',                           'darren.ekaseptian@sprout.co.id',       'UI/UX Designer',                       (select id from public.organizations where name = 'UI/UX'), (select id from public.roles where name = 'STAFF')),
  ('Bimo Prayogo Muhammad',                       'bimo.prayogo@sprout.co.id',            'UI/UX Designer',                       (select id from public.organizations where name = 'UI/UX'), (select id from public.roles where name = 'STAFF')),
  ('Glenn Vhalado Dykaputra L. Toruan',           'glenn.vhalado@sprout.co.id',           'UI/UX Designer',                       (select id from public.organizations where name = 'UI/UX'), (select id from public.roles where name = 'STAFF')),

  -- Quality Assurance
  ('Wirapa Pillay',                               'wirapa.pillay@sprout.co.id',           'VP of Quality Assurance',              (select id from public.organizations where name = 'Quality Assurance'), (select id from public.roles where name = 'SQUAD LEAD')),
  ('Devi Rahmawati',                              'devi.rahmawati@sprout.co.id',          'QA Engineer Associate',                (select id from public.organizations where name = 'Quality Assurance'), (select id from public.roles where name = 'STAFF')),
  ('Sangan Nathan',                               'sangan.nathan@sprout.co.id',           'QA Lead',                              (select id from public.organizations where name = 'Quality Assurance'), (select id from public.roles where name = 'STAFF')),
  ('Triisya Velly',                               'triisya.velly@sprout.co.id',           'QA Engineer Associate',                (select id from public.organizations where name = 'Quality Assurance'), (select id from public.roles where name = 'STAFF')),
  ('Rahadiyan Koesandrianto',                     'rahadiyan.koesandrianto@sprout.co.id', 'QA Engineer (Associate)',              (select id from public.organizations where name = 'Quality Assurance'), (select id from public.roles where name = 'STAFF')),
  ('Dian Marsha Putri',                           'dian.marsha@sprout.co.id',             'Sr QA Engineer',                       (select id from public.organizations where name = 'Quality Assurance'), (select id from public.roles where name = 'STAFF')),
  ('Muhammad Raihan Mubaroq',                     'muhammad.raihan@sprout.co.id',         'QA Engineer Junior',                   (select id from public.organizations where name = 'Quality Assurance'), (select id from public.roles where name = 'STAFF')),
  ('Leni Hendra',                                 'leni.hendra@sprout.co.id',             'QA Engineer Associate',                (select id from public.organizations where name = 'Quality Assurance'), (select id from public.roles where name = 'STAFF')),

  -- Tech
  ('Heri Herlambang Lumanto',                     'heri.herlambang@sprout.co.id',         'IT System Admin',                      (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Maya Andira',                                 'maya.andira@sprout.co.id',             'Scrum Master',                         (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Muhammad Firza',                              'muhammad.firza@sprout.co.id',          'Data Engineer',                        (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Ugan Saripudin',                              'ugan.saripudin@sprout.co.id',          'Tech Lead',                            (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'SQUAD LEAD')),
  ('Faisal Ariyanto',                             'faisal.ariyanto@sprout.co.id',         'Team Lead',                            (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'SQUAD LEAD')),
  ('Kevin Godrikus Archibald Tagading P',         'kevin.gading@sprout.co.id',            'Team Lead',                            (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Muhammad Azki Darmawan',                      'azki.darmawan@sprout.co.id',           'Tech Lead',                            (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Bagus Kurnianto',                             'bagus.kurnianto@sprout.co.id',         'Lead Mobile Developer',                (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Valentinus Hendy Odwin Santoso',              'hendy.odwin@sprout.co.id',             'Sr. Mobile Developer',                 (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('David Santoso',                               'david.santoso@sprout.co.id',           'Mobile Developer',                     (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Sesaka Aji Nursah Bantani',                   'sesaka.aji@sprout.co.id',              'Jr Mobile Developer',                  (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Jaka Hajar Wiguna',                           'jaka.hajar@sprout.co.id',              'Mobile Developer',                     (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Zikry Kurniawan',                             'zikry.kurniawan@sprout.co.id',         'Sr. Backend Engineer',                 (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Alda Delas',                                  'alda.delas@sprout.co.id',              'Software Engineer',                    (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Bintang Muhammad Wahid',                      'bintang.muhammad@sprout.co.id',        'Backend Engineer',                     (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Fakhrul Muhammad Rijal',                      'fakhrul.rijal@sprout.co.id',           'Backend Engineer',                     (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Teddy Adji Pangestu',                         'teddy.adji@sprout.co.id',              'Frontend Engineer',                    (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Gaizka Valencia',                             'gaizka.valencia@sprout.co.id',         'Jr. Software Engineer',                (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Fian Febry Ispianto',                         'fian.febry@sprout.co.id',              'Frontend Engineer',                    (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Al Fatih Abdurrahman Syah',                   'al.fatih@sprout.co.id',                'Software Engineer',                    (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Mahar Prasetio',                              'mahar.prasetio@sprout.co.id',          'Sr. Fullstack Engineer',               (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Irwin Pratajaya',                             'irwin.pratajaya@sprout.co.id',         'Sr. Software Engineer',                (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Muhamad Danang Priambodo',                    'muhamad.danang@sprout.co.id',          'Software Engineer',                    (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'TOP MANAGEMENT')),
  ('Rizky Maulita Putri',                         'rizky.maulita@sprout.co.id',           'Software Engineer',                    (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Ryan Apratama',                               'ryan.apratama@sprout.co.id',           'Software Engineer',                    (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Marcellus Denta Widyapramana',                'marcellus.denta@sprout.co.id',         'Software Engineer',                    (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Fawaz',                                       'fawaz.hustomi@sprout.co.id',           'Software Engineer',                    (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Yusuf Farhan Abdullah',                       'yusuf.farhan@sprout.co.id',            'Software Engineer',                    (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Herjuno Pangestu',                            'herjuno.pangestu@sprout.co.id',        'DevOps',                               (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Ahmad Dhiya Ilmam Putra',                     'ahmad.dhiya@sprout.co.id',             'Jr DevOps',                            (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF')),
  ('Harun Arasyid',                               'harun.arasyid@sprout.co.id',           'Sr DevOps',                            (select id from public.organizations where name = 'Tech'), (select id from public.roles where name = 'STAFF'));

insert into public.employee_projects (employee_id, project_id)
select e.id, p.id
from public.employees e
inner join (
  values
    ('arnold.sebastian@sprout.co.id', 'SPROUT'),
    ('angelina.kesya@sprout.co.id', 'SPROUT'),
    ('christina.devi@sprout.co.id', 'SPROUT'),
    ('rebecca.deborah@sprout.co.id', 'SPROUT'),
    ('sukardi@sprout.co.id', 'SPROUT'),
    ('patricia.timothy@sprout.co.id', 'SPROUT'),
    ('gilang.satrya@sprout.co.id', 'SPROUT'),
    ('vania.aribowo@sprout.co.id', 'SPROUT'),
    ('sanny.martin@sprout.co.id', 'SPROUT'),
    ('sakti.ambawani@sprout.co.id', 'SPROUT'),
    ('alistair.tody@sprout.co.id', 'HI-FELLA'),
    ('nathanneal.audris@sprout.co.id', 'KHONIC'),
    ('lamhot.siahaan@sprout.co.id', 'SMARCO'),
    ('teguh.arianto@sprout.co.id', 'LABAMU SINGAPORE'),
    ('marlon.keintjem@sprout.co.id', 'SPROUT'),
    ('briyan.benget@sprout.co.id', 'HI-FELLA'),
    ('eldaa.warapsari@sprout.co.id', 'SPROUT'),
    ('reynaldo.damara@sprout.co.id', 'BOUCHON'),
    ('shafa.matahati@sprout.co.id', 'JAPFA'),
    ('grisviany@sprout.co.id', 'LABAMU SINGAPORE'),
    ('vanessa.gunawan@sprout.co.id', 'SPROUT'),
    ('moch.baiz@sprout.co.id', 'TOCO'),
    ('darren.ekaseptian@sprout.co.id', 'JAPFA'),
    ('bimo.prayogo@sprout.co.id', 'BOUCHON'),
    ('glenn.vhalado@sprout.co.id', 'SPECTRA'),
    ('wirapa.pillay@sprout.co.id', 'SPROUT'),
    ('devi.rahmawati@sprout.co.id', 'JAPFA'),
    ('sangan.nathan@sprout.co.id', 'SPROUT'),
    ('triisya.velly@sprout.co.id', 'JAPFA'),
    ('rahadiyan.koesandrianto@sprout.co.id', 'LABAMU SINGAPORE'),
    ('dian.marsha@sprout.co.id', 'LABAMU SINGAPORE'),
    ('muhammad.raihan@sprout.co.id', 'LABAMU SINGAPORE'),
    ('leni.hendra@sprout.co.id', 'QINERJA'),
    ('heri.herlambang@sprout.co.id', 'SPROUT'),
    ('maya.andira@sprout.co.id', 'LABAMU'),
    ('muhammad.firza@sprout.co.id', 'EDOTCO'),
    ('ugan.saripudin@sprout.co.id', 'LABAMU'),
    ('faisal.ariyanto@sprout.co.id', 'ALODOKTER'),
    ('kevin.gading@sprout.co.id', 'HI-FELLA'),
    ('bagus.kurnianto@sprout.co.id', 'LABAMU SINGAPORE'),
    ('hendy.odwin@sprout.co.id', 'LABAMU SINGAPORE'),
    ('david.santoso@sprout.co.id', 'LABAMU'),
    ('sesaka.aji@sprout.co.id', 'KHONIC'),
    ('jaka.hajar@sprout.co.id', 'QINERJA'),
    ('zikry.kurniawan@sprout.co.id', 'LABAMU'),
    ('alda.delas@sprout.co.id', 'LABAMU SINGAPORE'),
    ('bintang.muhammad@sprout.co.id', 'SMARCO'),
    ('fakhrul.rijal@sprout.co.id', 'SPECTRA'),
    ('teddy.adji@sprout.co.id', 'LABAMU'),
    ('gaizka.valencia@sprout.co.id', 'LABAMU'),
    ('fian.febry@sprout.co.id', 'BOUCHON'),
    ('al.fatih@sprout.co.id', 'LABAMU'),
    ('mahar.prasetio@sprout.co.id', 'BOUCHON'),
    ('irwin.pratajaya@sprout.co.id', 'JAPFA'),
    ('muhamad.danang@sprout.co.id', 'BOUCHON'),
    ('rizky.maulita@sprout.co.id', 'BOUCHON'),
    ('ryan.apratama@sprout.co.id', 'BOUCHON'),
    ('marcellus.denta@sprout.co.id', 'LABAMU SINGAPORE'),
    ('fawaz.hustomi@sprout.co.id', 'BOUCHON'),
    ('yusuf.farhan@sprout.co.id', 'JAPFA'),
    ('herjuno.pangestu@sprout.co.id', 'BOUCHON'),
    ('ahmad.dhiya@sprout.co.id', 'QINERJA'),
    ('harun.arasyid@sprout.co.id', 'BOUCHON'),
    ('fian.febry@sprout.co.id', 'Hackathon Signal'),
    ('eldaa.warapsari@sprout.co.id', 'Hackathon Signal')
) as v(email, project_name)
  on e.email = v.email
inner join public.projects p on p.name = v.project_name;

-- Every employee is also on SPROUT (multiple projects per person where applicable).
insert into public.employee_projects (employee_id, project_id)
select e.id, p.id
from public.employees e
inner join public.projects p on p.name = 'SPROUT'
on conflict (employee_id, project_id) do nothing;

-- Muhammad Azki Darmawan on every project.
insert into public.employee_projects (employee_id, project_id)
select e.id, p.id
from public.employees e
cross join public.projects p
where e.email = 'azki.darmawan@sprout.co.id'
on conflict (employee_id, project_id) do nothing;

-- Set squad leads per project (based on provided mapping)
update public.projects
set squad_lead_employee_id = (
  select id from public.employees where full_name = 'Alistair Tody' limit 1
)
where name = 'HI-FELLA';

update public.projects
set squad_lead_employee_id = (
  select id from public.employees where full_name = 'Tjiong Teguh Arianto' limit 1
)
where name in ('LABAMU SINGAPORE', 'JAPFA');

update public.projects
set squad_lead_employee_id = (
  select id from public.employees where full_name = 'Reynaldo Damara Salim' limit 1
)
where name = 'BOUCHON';

update public.projects
set squad_lead_employee_id = (
  select id from public.employees where full_name = 'Glenn Vhalado Dykaputra L. Toruan' limit 1
)
where name = 'SPECTRA';

update public.projects
set squad_lead_employee_id = (
  select id from public.employees where full_name = 'Marlon P V M Keintjem' limit 1
)
where name = 'EDOTCO';

update public.projects
set squad_lead_employee_id = (
  select id from public.employees where full_name = 'Faisal Ariyanto' limit 1
)
where name = 'ALODOKTER';

update public.projects
set squad_lead_employee_id = (
  select id from public.employees where email = 'fian.febry@sprout.co.id' limit 1
)
where name = 'Hackathon Signal';

-- ============================================================
-- SEED SIGNALS (for simulation / dashboards)
-- ============================================================

insert into public.signals (
  author_employee_id,
  is_anonymous,
  category,
  title,
  details,
  project_id,
  is_public,
  ai_issue_category,
  sentiment_score,
  concern_status,
  achievement_points
) values
  -- SPROUT
  (
    (select id from public.employees where full_name = 'Christina Devi Ariyani' limit 1)
  , false
  , 'concern'
  , 'SPROUT - Deploy Delay'
  , 'Deploy pipeline is taking longer than expected during peak hours. Suggest checking caching and queue configuration.'
  , (select id from public.projects where name = 'SPROUT' limit 1)
  , true
  , 'Process Bottleneck'
  , 35
  , 'open'
  , null
  ),
  (
    (select id from public.employees where full_name = 'Marlon P V M Keintjem' limit 1)
  , false
  , 'achievement'
  , 'SPROUT - On-time Release'
  , 'Delivered the release on schedule and coordinated cross-team handoff successfully. Great ownership.'
  , (select id from public.projects where name = 'SPROUT' limit 1)
  , true
  , null
  , 95
  , null
  , 5
  ),
  (
    (select id from public.employees where full_name = 'Egg Arnold Sebastian' limit 1)
  , false
  , 'achievement'
  , 'SPROUT - Mentored Ownership'
  , 'Supported team members with clear guidance and encouraged early risk surfacing. Positive impact observed.'
  , (select id from public.projects where name = 'SPROUT' limit 1)
  , true
  , 'Professional Growth'
  , 88
  , null
  , null
  ),
  (
    (select id from public.employees where full_name = 'Patricia Timothy' limit 1)
  , true
  , 'appreciation'
  , 'SPROUT - Great Collaboration'
  , 'Appreciate the collaboration and quick response during the last sprint. Felt safe and aligned throughout.'
  , (select id from public.projects where name = 'SPROUT' limit 1)
  , false
  , null
  , 92
  , null
  , null
  ),
  (
    (select id from public.employees where full_name = 'Sukardi' limit 1)
  , false
  , 'achievement'
  , 'SPROUT - Better Reporting'
  , 'Improved reporting quality and transparency by consolidating updates into a single weekly view.'
  , (select id from public.projects where name = 'SPROUT' limit 1)
  , true
  , 'Process Bottleneck'
  , 85
  , null
  , null
  ),

  -- HI-FELLA
  (
    (select id from public.employees where full_name = 'Eldaa Warapsari' limit 1)
  , false
  , 'concern'
  , 'HI-FELLA - Requirement Volatility'
  , 'Noticed frequent changes to requirements late in the cycle. Consider locking scope earlier or using change checkpoints.'
  , (select id from public.projects where name = 'HI-FELLA' limit 1)
  , true
  , 'Scope Creep'
  , 28
  , 'in_progress'
  , null
  ),
  (
    (select id from public.employees where full_name = 'Briyan Benget Alfonsius' limit 1)
  , false
  , 'concern'
  , 'HI-FELLA - Payment Edge Cases'
  , 'Some payment edge cases are not covered in current tests. Recommend adding regression scenarios for uncommon flows.'
  , (select id from public.projects where name = 'HI-FELLA' limit 1)
  , false
  , 'Technical Debt'
  , 42
  , 'open'
  , null
  ),
  (
    (select id from public.employees where full_name = 'Alistair Tody' limit 1)
  , false
  , 'achievement'
  , 'HI-FELLA - Customer Feedback Actioned'
  , 'Turned customer feedback into prioritized backlog items and aligned stakeholders within 48 hours.'
  , (select id from public.projects where name = 'HI-FELLA' limit 1)
  , true
  , 'Professional Growth'
  , 94
  , null
  , 6
  ),
  (
    (select id from public.employees where full_name = 'Vania Aribowo' limit 1)
  , true
  , 'appreciation'
  , 'HI-FELLA - Fast Stakeholder Updates'
  , 'Thank you for keeping stakeholders updated with clear progress notes. It improved trust and reduced last-minute surprises.'
  , (select id from public.projects where name = 'HI-FELLA' limit 1)
  , true
  , 'Communication Gap'
  , 89
  , null
  , null
  ),

  -- KHONIC
  (
    (select id from public.employees where full_name = 'Nathanneal Audris' limit 1)
  , false
  , 'achievement'
  , 'KHONIC - Clean Backlog Grooming'
  , 'Held effective backlog grooming and removed ambiguity early. Team velocity improved next sprint.'
  , (select id from public.projects where name = 'KHONIC' limit 1)
  , true
  , 'Process Bottleneck'
  , 91
  , null
  , null
  ),
  (
    (select id from public.employees where full_name = 'Lamhot Pardamean Siahaan' limit 1)
  , false
  , 'concern'
  , 'KHONIC - QA Regression Risk'
  , 'Potential regression risk due to rushed merges. Recommend tighter PR checks and smoke test automation.'
  , (select id from public.projects where name = 'KHONIC' limit 1)
  , false
  , 'Technical Debt'
  , 32
  , 'open'
  , null
  ),
  (
    (select id from public.employees where full_name = 'Sanny Martin' limit 1)
  , true
  , 'appreciation'
  , 'KHONIC - Cross-team Support'
  , 'Appreciate the support from Sales to clarify requirements and unblock delivery. Great ownership.'
  , (select id from public.projects where name = 'KHONIC' limit 1)
  , true
  , 'Communication Gap'
  , 87
  , null
  , null
  ),

  -- SMARCO
  (
    (select id from public.employees where full_name = 'Lamhot Pardamean Siahaan' limit 1)
  , false
  , 'concern'
  , 'SMARCO - Sprint Scope Creep'
  , 'Scope is expanding during sprint execution. Consider a strict mid-sprint review to prevent late churn.'
  , (select id from public.projects where name = 'SMARCO' limit 1)
  , true
  , 'Scope Creep'
  , 22
  , 'in_progress'
  , null
  ),
  (
    (select id from public.employees where full_name = 'Lamhot Pardamean Siahaan' limit 1)
  , false
  , 'concern'
  , 'SMARCO - Test Coverage Gap'
  , 'Unit test coverage is currently uneven. Requesting a quick coverage audit and prioritized test additions.'
  , (select id from public.projects where name = 'SMARCO' limit 1)
  , false
  , 'Technical Debt'
  , 38
  , 'open'
  , null
  ),
  (
    (select id from public.employees where full_name = 'Teddy Adji Pangestu' limit 1)
  , false
  , 'appreciation'
  , 'SMARCO - Quick Bug Fix'
  , 'Thanks for responding quickly to production issues and communicating the mitigation plan clearly.'
  , (select id from public.projects where name = 'SMARCO' limit 1)
  , true
  , 'Communication Gap'
  , 96
  , null
  , null
  ),

  -- LABAMU SINGAPORE
  (
    (select id from public.employees where full_name = 'Grisviany' limit 1)
  , false
  , 'achievement'
  , 'LABAMU SG - Strategy Clarity'
  , 'Provided clear product strategy and aligned stakeholders early. Reduced ambiguity and improved follow-through.'
  , (select id from public.projects where name = 'LABAMU SINGAPORE' limit 1)
  , true
  , 'Communication Gap'
  , 88
  , null
  , null
  ),
  (
    (select id from public.employees where full_name = 'Bimo Prayogo Muhammad' limit 1)
  , false
  , 'achievement'
  , 'LABAMU SG - UX Improvement'
  , 'Improved UX flows based on feedback and ensured accessibility considerations were included.'
  , (select id from public.projects where name = 'LABAMU SINGAPORE' limit 1)
  , true
  , 'Office Environment'
  , 92
  , null
  , null
  ),
  (
    (select id from public.employees where full_name = 'Gaizka Valencia' limit 1)
  , false
  , 'achievement'
  , 'LABAMU SG - Feature Delivery'
  , 'Delivered requested improvements with strong documentation and safe incremental rollouts.'
  , (select id from public.projects where name = 'LABAMU SINGAPORE' limit 1)
  , true
  , 'Technical Debt'
  , 90
  , null
  , null
  ),
  (
    (select id from public.employees where full_name = 'Devi Rahmawati' limit 1)
  , false
  , 'concern'
  , 'LABAMU SG - QA Bottleneck'
  , 'QA throughput is limited due to review queues. Suggest scheduling earlier test planning to reduce bottlenecks.'
  , (select id from public.projects where name = 'LABAMU SINGAPORE' limit 1)
  , false
  , 'Process Bottleneck'
  , 41
  , 'open'
  , null
  ),
  (
    (select id from public.employees where full_name = 'Marcellus Denta Widyapramana' limit 1)
  , true
  , 'appreciation'
  , 'LABAMU SG - Reliable Support'
  , 'Appreciate the reliable support during integration. It felt safe to speak up when issues appeared.'
  , (select id from public.projects where name = 'LABAMU SINGAPORE' limit 1)
  , true
  , null
  , 93
  , null
  , null
  ),

  -- BOUCHON
  (
    (select id from public.employees where full_name = 'Reynaldo Damara Salim' limit 1)
    , false
    , 'achievement'
    , 'BOUCHON - Feature Alignment'
    , 'Aligned feature scope with stakeholders and removed blockers early through clear communication.'
    , (select id from public.projects where name = 'BOUCHON' limit 1)
    , true
    , 'Communication Gap'
    , 89
    , null
    , null
  ),
  (
    (select id from public.employees where full_name = 'Fian Febry Ispianto' limit 1)
    , false
    , 'concern'
    , 'BOUCHON - UI Logic Complexity'
    , 'The frontend state logic is becoming hard to maintain. Propose a refactor to use a cleaner state machine.'
    , (select id from public.projects where name = 'BOUCHON' limit 1)
    , true
    , 'Technical Debt'
    , 45
    , 'open'
    , null
  ),

  -- JAPFA
  (
    (select id from public.employees where full_name = 'Shafa Matahati' limit 1)
    , false
    , 'concern'
    , 'JAPFA - Late UI Feedback'
    , 'Received late UI feedback which impacted sprint planning. Recommend earlier review checkpoints and tighter design sign-offs.'
    , (select id from public.projects where name = 'JAPFA' limit 1)
    , false
    , 'Communication Gap'
    , 32
    , 'closed'
    , null
  ),
  (
    (select id from public.employees where full_name = 'Darren Ekaseptian' limit 1)
    , false
    , 'achievement'
    , 'JAPFA - Design System Integration'
    , 'Successfully integrated the Sprout design system into JAPFA components, ensuring UI consistency.'
    , (select id from public.projects where name = 'JAPFA' limit 1)
    , true
    , 'Office Environment'
    , 91
    , null
    , null
  ),

  -- TOCO
  (
    (select id from public.employees where full_name = 'Moch Baiz Kamarulredzuan' limit 1)
    , true
    , 'appreciation'
    , 'TOCO - Great Responsiveness'
    , 'Thank you for responding quickly to design questions and keeping delivery on track. It improved team confidence.'
    , (select id from public.projects where name = 'TOCO' limit 1)
    , true
    , 'Communication Gap'
    , 86
    , null
    , null
  ),

  -- SPECTRA
  (
    (select id from public.employees where full_name = 'Glenn Vhalado Dykaputra L. Toruan' limit 1)
    , false
    , 'achievement'
    , 'SPECTRA - Stable Release'
    , 'Maintained stable release cadence and ensured quality gates were met before production rollout.'
    , (select id from public.projects where name = 'SPECTRA' limit 1)
    , true
    , 'Process Bottleneck'
    , 94
    , null
    , null
  ),

  -- QINERJA
  (
    (select id from public.employees where full_name = 'Leni Hendra' limit 1)
    , false
    , 'concern'
    , 'QINERJA - Test Delays'
    , 'Test execution is delayed due to environment availability. Propose scheduling environments earlier and assigning backup test windows.'
    , (select id from public.projects where name = 'QINERJA' limit 1)
    , true
    , 'Process Bottleneck'
    , 38
    , 'in_progress'
    , null
  ),

  -- LABAMU
  (
    (select id from public.employees where full_name = 'Maya Andira' limit 1)
    , false
    , 'achievement'
    , 'LABAMU - Sprint Coaching'
    , 'Provided coaching that improved team estimates and reduced scope changes during sprint execution.'
    , (select id from public.projects where name = 'LABAMU' limit 1)
    , true
    , 'Professional Growth'
    , 92
    , null
    , null
  ),
  (
    (select id from public.employees where full_name = 'David Santoso' limit 1)
    , false
    , 'concern'
    , 'LABAMU - API Rate Limiting'
    , 'Encountering occasional 429 errors from internal APIs. Need to implement better retry logic or optimize calls.'
    , (select id from public.projects where name = 'LABAMU' limit 1)
    , false
    , 'Technical Debt'
    , 40
    , 'open'
    , null
  ),

  -- EDOTCO
  (
    (select id from public.employees where full_name = 'Muhammad Firza' limit 1)
    , false
    , 'appreciation'
    , 'EDOTCO - Data Quality Improvement'
    , 'Improved data pipeline validation, resulting in fewer downstream issues and clearer reporting. Great ownership.'
    , (select id from public.projects where name = 'EDOTCO' limit 1)
    , true
    , 'others'
    , 95
    , null
    , null
  ),

  -- ALODOKTER
  (
    (select id from public.employees where full_name = 'Faisal Ariyanto' limit 1)
    , false
    , 'concern'
    , 'ALODOKTER - Resource Constraints'
    , 'Resource constraints are impacting delivery timelines. Consider reallocating tasks or adjusting milestones to keep commitments realistic.'
    , (select id from public.projects where name = 'ALODOKTER' limit 1)
    , false
    , 'Burnout Alert'
    , 15
    , 'open'
    , null
  ),

  -- Hackathon Signal
  (
    (select id from public.employees where email = 'eldaa.warapsari@sprout.co.id' limit 1)
  , false
  , 'concern'
  , 'Hackathon Signal - Unclear Sprint Goals'
  , 'Sprint goals have been shifting mid-cycle without proper alignment. The team needs clearer scope definition at the start of each sprint to avoid rework and confusion.'
  , (select id from public.projects where name = 'Hackathon Signal' limit 1)
  , true
  , 'Scope Creep'
  , 30
  , 'open'
  , null
  ),
  (
    (select id from public.employees where email = 'eldaa.warapsari@sprout.co.id' limit 1)
  , false
  , 'achievement'
  , 'Hackathon Signal - Feature Delivery on Time'
  , 'Successfully delivered the ownership signal submission flow ahead of schedule. Clear requirements and tight collaboration between product and engineering made this possible.'
  , (select id from public.projects where name = 'Hackathon Signal' limit 1)
  , true
  , 'Professional Growth'
  , 88
  , null
  , null
  )
;

-- Targets for the seeded signals.
-- Each signal gets exactly one target row for simulation.
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'SPROUT - Deploy Delay';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'role',
  (select r.id from public.roles r where r.name = 'SQUAD LEAD' limit 1),
  null
from public.signals s where s.title = 'SPROUT - On-time Release';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'SPROUT - Mentored Ownership';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'employee',
  null,
  (select e.id from public.employees e where e.full_name = 'Angelina Kesya Christinatalia' limit 1)
from public.signals s where s.title = 'SPROUT - Great Collaboration';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'SPROUT - Better Reporting';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'HI-FELLA - Requirement Volatility';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'role',
  (select r.id from public.roles r where r.name = 'SQUAD LEAD' limit 1),
  null
from public.signals s where s.title = 'HI-FELLA - Payment Edge Cases';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'HI-FELLA - Customer Feedback Actioned';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'employee',
  null,
  (select e.id from public.employees e where e.full_name = 'Vania Aribowo' limit 1)
from public.signals s where s.title = 'HI-FELLA - Fast Stakeholder Updates';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'KHONIC - Clean Backlog Grooming';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'KHONIC - QA Regression Risk';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'role',
  (select r.id from public.roles r where r.name = 'STAFF' limit 1),
  null
from public.signals s where s.title = 'KHONIC - Cross-team Support';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'SMARCO - Sprint Scope Creep';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'role',
  (select r.id from public.roles r where r.name = 'SQUAD LEAD' limit 1),
  null
from public.signals s where s.title = 'SMARCO - Test Coverage Gap';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'employee',
  null,
  (select e.id from public.employees e where e.full_name = 'Teddy Adji Pangestu' limit 1)
from public.signals s where s.title = 'SMARCO - Quick Bug Fix';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'LABAMU SG - Strategy Clarity';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'LABAMU SG - UX Improvement';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'role',
  (select r.id from public.roles r where r.name = 'SQUAD LEAD' limit 1),
  null
from public.signals s where s.title = 'LABAMU SG - Feature Delivery';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'LABAMU SG - QA Bottleneck';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'employee',
  null,
  (select e.id from public.employees e where e.full_name = 'Marcellus Denta Widyapramana' limit 1)
from public.signals s where s.title = 'LABAMU SG - Reliable Support';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'BOUCHON - Feature Alignment';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'BOUCHON - UI Logic Complexity';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'JAPFA - Late UI Feedback';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'JAPFA - Design System Integration';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'TOCO - Great Responsiveness';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'SPECTRA - Stable Release';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'QINERJA - Test Delays';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'LABAMU - Sprint Coaching';
insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'role',
  (select r.id from public.roles r where r.name = 'SQUAD LEAD' limit 1),
  null
from public.signals s where s.title = 'LABAMU - API Rate Limiting';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'EDOTCO - Data Quality Improvement';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'ALODOKTER - Resource Constraints';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'Hackathon Signal - Unclear Sprint Goals';

insert into public.signal_targets (signal_id, target_type, target_role_id, target_employee_id)
select s.id, 'all', null, null from public.signals s where s.title = 'Hackathon Signal - Feature Delivery on Time';

-- ============================================================
-- ALIVE DASHBOARD SEEDING (30d History & Gamification)
-- Targets: fian.febry@sprout.co.id and trending sections
-- ============================================================

DO $$
DECLARE
  fian_id uuid;
  bouchon_id uuid;
  hackathon_id uuid;
  japfa_id uuid;
  i INTEGER;
  score INTEGER;
  cat TEXT;
  status TEXT;
  issue_cat TEXT;
BEGIN
  -- 1. Identify Target IDs
  SELECT id INTO fian_id FROM public.employees WHERE email = 'fian.febry@sprout.co.id' LIMIT 1;
  SELECT id INTO bouchon_id FROM public.projects WHERE name = 'BOUCHON' LIMIT 1;
  SELECT id INTO hackathon_id FROM public.projects WHERE name = 'Hackathon Signal' LIMIT 1;
  SELECT id INTO japfa_id FROM public.projects WHERE name = 'JAPFA' LIMIT 1;

  IF fian_id IS NULL THEN
    RAISE NOTICE 'Fian Febry not found.';
    RETURN;
  END IF;

  -- 2. Contribution Points (Achievements for Fian)
  FOR i IN 1..135 LOOP
    INSERT INTO public.signals (
      author_employee_id, is_anonymous, category, title, details, project_id,
      is_public, sentiment_score, concern_status, created_at
    ) VALUES (
      fian_id, false, 'achievement',
      'High-Impact Delivery #' || i,
      'Personal contribution towards ' || (CASE WHEN i%2=0 THEN 'frontend optimization' ELSE 'state architecture' END) || '. Consistent results.',
      CASE WHEN i%2=0 THEN bouchon_id ELSE hackathon_id END, true, 80 + (random()*20), null,
      now() - (i || ' days')::interval
    );
  END LOOP;

  -- 3. Trend Data (60 signals for activity volume and sentiment pulses)
  FOR i IN 1..60 LOOP
    -- Randomly pick category
    IF i % 4 = 0 THEN cat := 'concern'; ELSEIF i % 4 = 1 THEN cat := 'achievement'; ELSE cat := 'appreciation'; END IF;
    
    -- Issue Categories for diversity
    IF cat = 'concern' THEN
       IF i % 6 = 0 THEN issue_cat := 'Burnout Alert'; score := 10 + (random()*20); status := 'open';
       ELSEIF i % 6 = 1 THEN issue_cat := 'Scope Creep'; score := 30 + (random()*20); status := 'in_progress';
       ELSEIF i % 6 = 2 THEN issue_cat := 'Process Bottleneck'; score := 40 + (random()*20); status := 'open';
       ELSEIF i % 6 = 3 THEN issue_cat := 'Technical Debt'; score := 50 + (random()*20); status := 'closed';
       ELSEIF i % 6 = 4 THEN issue_cat := 'Professional Growth'; score := 80 + (random()*10); status := 'closed';
       ELSE issue_cat := 'Communication Gap'; score := 60 + (random()*20); status := 'open';
       END IF;
    ELSE
       issue_cat := NULL;
       score := 70 + (random()*30);
       status := NULL;
    END IF;

    INSERT INTO public.signals (
      author_employee_id, is_anonymous, category, title, details, project_id,
      is_public, sentiment_score, concern_status, ai_issue_category, created_at
    ) VALUES (
      (SELECT id FROM public.employees WHERE email != 'fian.febry@sprout.co.id' OFFSET floor(random()*50) LIMIT 1),
      (random() > 0.8), cat,
      'Squad Pulse Data #' || i,
      'Simulated signal for analytics verification.',
      CASE WHEN i%3=0 THEN bouchon_id WHEN i%3=1 THEN hackathon_id ELSE japfa_id END, true, score, status,
      issue_cat,
      now() - (random() * 30 || ' days')::interval
    );
  END LOOP;

  -- 4. Critical Project (Burnout Alert trigger)
  FOR i IN 1..15 LOOP
    INSERT INTO public.signals (
      author_employee_id, is_anonymous, category, title, details, project_id,
      is_public, sentiment_score, concern_status, ai_issue_category, created_at
    ) VALUES (
      (SELECT id FROM public.employees OFFSET floor(random()*50) LIMIT 1),
      true, 'concern',
      'Critical Feedback JAPFA #' || i,
      'Struggling with unclear requirements and over-working. High burnout risk.',
      japfa_id, true, 5 + (random()*20), 'open', 'Burnout Alert',
      now() - (random() * 10 || ' days')::interval
    );
  END LOOP;

  -- 5. Team Activity Feed (Appreciations to Fian)
  FOR i IN 1..10 LOOP
    INSERT INTO public.signals (
      author_employee_id, is_anonymous, category, title, details, project_id,
      is_public, sentiment_score, concern_status, created_at
    ) VALUES (
      (SELECT id FROM public.employees WHERE email != 'fian.febry@sprout.co.id' OFFSET floor(random()*50) LIMIT 1),
      false, 'appreciation',
      'Kudos for Fian #' || i,
      'Thanks for the great work on ' || (CASE WHEN i%2=0 THEN 'the dashboard' ELSE 'Recharts integration' END) || '!',
      hackathon_id, true, 95 + (random()*5), null,
      now() - (i || ' hours')::interval
    );
  END LOOP;

  RAISE NOTICE 'Alive dashboard data appended successfully.';
END $$;
