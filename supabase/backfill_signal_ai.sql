-- ============================================================
-- One-time backfill: signals.sentiment_score + signals.ai_issue_category
-- ============================================================
-- Run this once in Supabase SQL Editor after adding the new columns.
-- It only fills rows where at least one AI field is still NULL.

with prepared as (
  select
    s.id,
    s.category,
    lower(coalesce(s.title, '') || ' ' || coalesce(s.details, '')) as raw_text
  from public.signals s
  where s.sentiment_score is null or s.ai_issue_category is null
),
classified as (
  select
    p.id,
    case
      when p.raw_text ~* '(burnout|overwork|exhaust|fatigue|stress)' then 'Burnout Alert'
      when p.raw_text ~* '(scope|requirement|rework|changing target|unclear target)' then 'Scope Creep'
      when p.raw_text ~* '(blocker|bottleneck|approval|slow process|dependency delay)' then 'Process Bottleneck'
      when p.raw_text ~* '(miscommunicat|communication|alignment|handoff|unclear brief)' then 'Communication Gap'
      when p.raw_text ~* '(tech debt|legacy|refactor|fragile code|workaround)' then 'Technical Debt'
      when p.raw_text ~* '(micromanage|micro-manage|too much control|no autonomy)' then 'Micro-management'
      when p.raw_text ~* '(mentorship|learning|growth|career|promotion|skill)' then 'Professional Growth'
      when p.raw_text ~* '(office|workspace|facility|noise|remote setup|environment)' then 'Office Environment'
      else 'others'
    end as issue_category,
    case
      when p.category = 'achievement' then 78
      when p.category = 'appreciation' then 82
      when p.category = 'concern' then 32
      else 50
    end as base_sentiment,
    p.raw_text
  from prepared p
),
scored as (
  select
    c.id,
    c.issue_category,
    least(
      100,
      greatest(
        0,
        round(
          c.base_sentiment
          + case when c.raw_text ~* '(resolved|improved|great|success|supportive|helpful|efficient)' then 10 else 0 end
          - case when c.raw_text ~* '(blocked|delay|risk|issue|problem|conflict|unclear|late)' then 10 else 0 end
          - case when c.issue_category in ('Burnout Alert', 'Micro-management') then 8 else 0 end
          + case when c.issue_category = 'Professional Growth' then 8 else 0 end
        )::int
      )
    ) as sentiment_score
  from classified c
)
update public.signals s
set
  sentiment_score = coalesce(s.sentiment_score, scored.sentiment_score),
  ai_issue_category = coalesce(s.ai_issue_category, scored.issue_category)
from scored
where s.id = scored.id;

-- Optional quick check:
-- select count(*) as still_missing
-- from public.signals
-- where sentiment_score is null or ai_issue_category is null;
