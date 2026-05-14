-- ============================================================
-- Lantern — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id             uuid references auth.users primary key,
  name           text,
  university     text,
  grad_year      int,
  major          text,
  email_verified boolean default true,
  created_at     timestamptz default now()
);
-- Migration for existing deployments (run once in Supabase SQL editor):
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified boolean default true;

-- Companies
create table if not exists public.companies (
  id                 uuid default gen_random_uuid() primary key,
  name               text unique not null,
  industry           text,
  avg_rating         float default 0,
  review_count       int default 0,
  rating_work        float default 0,
  rating_mentorship  float default 0,
  rating_compensation float default 0,
  rating_culture     float default 0,
  return_offer_rate  float default 0,
  top_tags           text[] default '{}',
  ai_overview        text,
  created_at         timestamptz default now()
);

-- Reviews
create table if not exists public.reviews (
  id                   uuid default gen_random_uuid() primary key,
  user_id              uuid references auth.users,
  company_id           uuid references public.companies,
  role_title           text not null,
  team                 text,
  internship_year      int,
  duration_months      int,
  location_type        text,
  location             text,
  rating               float,
  rating_work          float,
  rating_mentorship    float,
  rating_compensation  float,
  rating_culture       float,
  work_description     text,
  one_line_summary     text,
  tech_used            text[] default '{}',
  interview_rounds     int,
  interview_topics     text[] default '{}',
  interview_difficulty int,
  days_to_offer        int,
  specific_questions   text,
  would_return         boolean,
  would_recommend      boolean,
  anonymous            boolean default true,
  show_university      boolean default false,
  helpful_count        int default 0,
  is_approved          boolean default true,
  created_at           timestamptz default now()
);

-- Review comments and questions
create table if not exists public.review_comments (
  id          uuid default gen_random_uuid() primary key,
  review_id   uuid references public.reviews not null,
  user_id     uuid references auth.users not null,
  author_name text not null default 'Anonymous',
  content     text not null,
  is_question boolean default false,
  created_at  timestamptz default now()
);
-- Run in Supabase SQL editor:
-- create table if not exists public.review_comments (
--   id uuid default gen_random_uuid() primary key,
--   review_id uuid references public.reviews not null,
--   user_id uuid references auth.users not null,
--   author_name text not null default 'Anonymous',
--   content text not null,
--   is_question boolean default false,
--   created_at timestamptz default now()
-- );
-- alter table public.review_comments enable row level security;
-- create policy "comments_read" on public.review_comments for select using (true);
-- create policy "comments_insert" on public.review_comments for insert to authenticated with check (user_id = auth.uid());
-- create policy "comments_delete_own" on public.review_comments for delete to authenticated using (user_id = auth.uid());

-- Saved companies
create table if not exists public.saved_companies (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users,
  company_id  uuid references public.companies,
  created_at  timestamptz default now(),
  unique(user_id, company_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.reviews enable row level security;
alter table public.saved_companies enable row level security;

-- Profiles
create policy "profiles_read_own" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid());

-- Companies (public read for SEO/AdSense; inserts via authenticated users or RPC)
create policy "companies_read" on public.companies for select using (true);
create policy "companies_insert" on public.companies for insert to authenticated with check (true);
create policy "companies_update" on public.companies for update to authenticated using (true);

-- Reviews (public read of approved reviews for SEO/AdSense)
create policy "reviews_read" on public.reviews for select using (is_approved = true);
-- Run in Supabase SQL editor to apply to existing deployment:
-- DROP POLICY IF EXISTS "companies_read" ON public.companies;
-- CREATE POLICY "companies_read" ON public.companies FOR SELECT USING (true);
-- DROP POLICY IF EXISTS "reviews_read" ON public.reviews;
-- CREATE POLICY "reviews_read" ON public.reviews FOR SELECT USING (is_approved = true);
create policy "reviews_insert" on public.reviews for insert to authenticated with check (user_id = auth.uid());
create policy "reviews_update_own" on public.reviews for update to authenticated using (user_id = auth.uid());
create policy "reviews_delete_own" on public.reviews for delete to authenticated using (user_id = auth.uid());

-- Saved companies
create policy "saved_read_own" on public.saved_companies for select to authenticated using (user_id = auth.uid());
create policy "saved_insert_own" on public.saved_companies for insert to authenticated with check (user_id = auth.uid());
create policy "saved_delete_own" on public.saved_companies for delete to authenticated using (user_id = auth.uid());

-- ============================================================
-- Function: recalculate company stats after a review change
-- ============================================================
create or replace function public.recalculate_company_stats(cid uuid)
returns void language plpgsql security definer as $$
declare
  r record;
  total int;
begin
  select
    count(*)                                                         as cnt,
    coalesce(avg(rating_work), 0)                                   as rw,
    coalesce(avg(rating_mentorship), 0)                             as rm,
    coalesce(avg(rating_compensation), 0)                           as rc,
    coalesce(avg(rating_culture), 0)                                as rcu,
    coalesce(
      sum(case when would_return then 1 else 0 end)::float /
      nullif(count(case when would_return is not null then 1 end), 0) * 100
    , 0)                                                             as ror
  into r
  from public.reviews
  where company_id = cid and is_approved = true;

  update public.companies set
    review_count        = r.cnt,
    rating_work         = round(r.rw::numeric, 2),
    rating_mentorship   = round(r.rm::numeric, 2),
    rating_compensation = round(r.rc::numeric, 2),
    rating_culture      = round(r.rcu::numeric, 2),
    avg_rating          = round(((r.rw + r.rm + r.rc + r.rcu) / 4)::numeric, 2),
    return_offer_rate   = round(r.ror::numeric, 1)
  where id = cid;
end;
$$;

-- Trigger: auto-update stats on review insert/delete
create or replace function public.trigger_recalculate()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_company_stats(old.company_id);
  else
    perform public.recalculate_company_stats(new.company_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_recalculate on public.reviews;
create trigger reviews_recalculate
  after insert or update or delete on public.reviews
  for each row execute function public.trigger_recalculate();

-- ============================================================
-- Seed: 12 companies
-- ============================================================
insert into public.companies (name, industry) values
('Stripe',     'Fintech'),
('Google',     'Technology'),
('Meta',       'Technology'),
('Amazon',     'Technology'),
('Microsoft',  'Technology'),
('Apple',      'Technology'),
('Netflix',    'Streaming'),
('Airbnb',     'Travel/Tech'),
('Uber',       'Mobility'),
('Lyft',       'Mobility'),
('Figma',      'Design Tools'),
('Notion',     'Productivity'),
('Linear',     'Dev Tools'),
('Vercel',     'Dev Tools'),
('Snowflake',  'Data/Cloud'),
('Databricks', 'Data/AI'),
('Coinbase',   'Crypto/Fintech'),
('OpenAI',     'AI'),
('Anthropic',  'AI'),
('Palantir',   'Data/Analytics'),
('Roblox',     'Gaming'),
('Discord',    'Social'),
('Spotify',    'Streaming'),
('Twitch',     'Streaming'),
('Nvidia',     'Semiconductors'),
('AMD',        'Semiconductors'),
('Salesforce', 'Enterprise SaaS'),
('Adobe',      'Creative Software'),
('Intuit',     'Fintech'),
('Dropbox',    'Cloud Storage')
on conflict (name) do nothing;
