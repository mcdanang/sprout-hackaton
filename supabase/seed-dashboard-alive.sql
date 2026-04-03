-- Dashboard Alive Seeding (30d History & Gamification)
-- Purpose: Make current dashboard sections (Staff, Lead, Management) look high-fidelity.
-- Targets employee: fian.febry@sprout.co.id

DO $$
DECLARE
  fian_id uuid;
  bouchon_id uuid;
  hackathon_id uuid;
  i INTEGER;
  score INTEGER;
  cat TEXT;
  status TEXT;
  issue_cat TEXT;
  pts INTEGER;
BEGIN
  -- 1. Identify Target IDs
  SELECT id INTO fian_id FROM public.employees WHERE email = 'fian.febry@sprout.co.id' LIMIT 1;
  SELECT id INTO bouchon_id FROM public.projects WHERE name = 'BOUCHON' LIMIT 1;
  SELECT id INTO hackathon_id FROM public.projects WHERE name = 'Hackathon Signal' LIMIT 1;

  IF fian_id IS NULL THEN
    RAISE NOTICE 'Fian Febry not found. Please ensure seed.sql was run.';
    RETURN;
  END IF;

  -- 2. Populate Points (Historical Achievements for Fian)
  -- 25 major achievements from last 60 days
  FOR i IN 1..25 LOOP
    pts := (random() * 15 + 5)::integer; -- 5 to 20 pts
    INSERT INTO public.signals (
      author_employee_id, is_anonymous, category, title, details, project_id, 
      is_public, sentiment_score, concern_status, achievement_points, created_at
    ) VALUES (
      fian_id, false, 'achievement', 
      'Milestone Completion #' || i, 
      'Successfully reached milestone ' || i || ' with excellent quality and on-time delivery. Great job in managing state logic.',
      bouchon_id, true, 85 + (random()*10), null, pts,
      now() - (i || ' days')::interval
    );
  END LOOP;

  -- 3. Populate Team Activity & Spirit (Concerns for Projects Lead by/Used by Fian)
  -- Projects: BOUCHON, Hackathon Signal
  FOR i IN 1..50 LOOP
    -- Randomly pick project
    IF i % 2 = 0 THEN bouchon_id := bouchon_id; ELSE bouchon_id := hackathon_id; END IF;
    
    -- Randomly pick category
    IF i % 3 = 0 THEN cat := 'concern'; ELSEIF i % 3 = 1 THEN cat := 'achievement'; ELSE cat := 'appreciation'; END IF;
    
    -- Randomly pick Issue Category for concerns
    IF cat = 'concern' THEN
       IF i % 5 = 0 THEN issue_cat := 'Burnout Alert'; score := 15 + (random()*20); status := 'open';
       ELSEIF i % 5 = 1 THEN issue_cat := 'Scope Creep'; score := 30 + (random()*20); status := 'in_progress';
       ELSEIF i % 5 = 2 THEN issue_cat := 'Process Bottleneck'; score := 40 + (random()*20); status := 'open';
       ELSEIF i % 5 = 3 THEN issue_cat := 'Technical Debt'; score := 50 + (random()*20); status := 'closed';
       ELSE issue_cat := 'Communication Gap'; score := 60 + (random()*20); status := 'open';
       END IF;
    ELSE
       issue_cat := NULL;
       score := 70 + (random()*30);
       status := NULL;
    END IF;

    INSERT INTO public.signals (
      author_employee_id, is_anonymous, category, title, details, project_id, 
      is_public, sentiment_score, concern_status, achievement_points, ai_issue_category, created_at
    ) VALUES (
      (SELECT id FROM public.employees WHERE email != 'fian.febry@sprout.co.id' OFFSET floor(random()*50) LIMIT 1),
      (random() > 0.7), cat, 
      'Automated Signal #' || i, 
      'Description for automated signal #' || i || '. This helps populate the trend charts and activity feeds.',
      bouchon_id, true, score, status, NULL, issue_cat,
      now() - (random() * 30 || ' days')::interval
    );
  END LOOP;

  -- 4. Burnout Triggers (Low sentiment for a specific project)
  -- Let's make "JAPFA" project critical
  FOR i IN 1..10 LOOP
    INSERT INTO public.signals (
      author_employee_id, is_anonymous, category, title, details, project_id, 
      is_public, sentiment_score, concern_status, achievement_points, ai_issue_category, created_at
    ) VALUES (
      (SELECT id FROM public.employees OFFSET floor(random()*50) LIMIT 1),
      true, 'concern', 
      'High Stress in JAPFA #' || i, 
      'Critical workload and missing clear direction in JAPFA squad. Burnout risk is very high.',
      (SELECT id FROM public.projects WHERE name = 'JAPFA' LIMIT 1),
      true, 10 + (random()*15), 'open', NULL, 'Burnout Alert',
      now() - (random() * 7 || ' days')::interval
    );
  END LOOP;

  RAISE NOTICE 'Dashboard seeding for Fian completed successfully.';
END $$;
