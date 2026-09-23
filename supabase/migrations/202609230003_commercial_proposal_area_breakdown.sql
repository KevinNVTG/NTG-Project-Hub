-- NTG Project Hub v0.11.2 - Estimated T&M Budget by Area
create table if not exists public.commercial_proposal_areas (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.commercial_proposals(id) on delete cascade,
  sort_order integer not null default 0,
  area_name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.commercial_proposal_area_labor (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.commercial_proposal_areas(id) on delete cascade,
  labor_rate_id uuid not null references public.commercial_proposal_labor_rates(id) on delete cascade,
  estimated_st_hours numeric(12,2) not null default 0,
  estimated_ot_hours numeric(12,2) not null default 0,
  estimated_dt_hours numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(area_id,labor_rate_id)
);
alter table public.commercial_proposal_items add column if not exists area_id uuid references public.commercial_proposal_areas(id) on delete set null;
drop trigger if exists commercial_proposal_areas_updated_at on public.commercial_proposal_areas;
create trigger commercial_proposal_areas_updated_at before update on public.commercial_proposal_areas for each row execute function public.set_updated_at();
drop trigger if exists commercial_proposal_area_labor_updated_at on public.commercial_proposal_area_labor;
create trigger commercial_proposal_area_labor_updated_at before update on public.commercial_proposal_area_labor for each row execute function public.set_updated_at();
alter table public.commercial_proposal_areas enable row level security;
alter table public.commercial_proposal_area_labor enable row level security;
drop policy if exists "authenticated commercial proposal areas all" on public.commercial_proposal_areas;
create policy "authenticated commercial proposal areas all" on public.commercial_proposal_areas for all to authenticated using (true) with check (true);
drop policy if exists "authenticated commercial proposal area labor all" on public.commercial_proposal_area_labor;
create policy "authenticated commercial proposal area labor all" on public.commercial_proposal_area_labor for all to authenticated using (true) with check (true);
grant select,insert,update,delete on public.commercial_proposal_areas to authenticated;
grant select,insert,update,delete on public.commercial_proposal_area_labor to authenticated;
