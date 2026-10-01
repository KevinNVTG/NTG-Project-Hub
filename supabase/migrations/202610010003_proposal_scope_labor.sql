create table if not exists public.commercial_proposal_scope_labor (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.commercial_proposals(id) on delete cascade,
  csi_section_id uuid not null references public.commercial_proposal_csi_sections(id) on delete cascade,
  labor_rate_id uuid not null references public.commercial_proposal_labor_rates(id) on delete cascade,
  estimated_st_hours numeric not null default 0,
  estimated_ot_hours numeric not null default 0,
  estimated_dt_hours numeric not null default 0,
  created_at timestamptz not null default now(),
  unique(proposal_id,csi_section_id,labor_rate_id)
);
alter table public.commercial_proposal_scope_labor enable row level security;
create policy "authenticated users manage proposal scope labor" on public.commercial_proposal_scope_labor for all to authenticated using (true) with check (true);
