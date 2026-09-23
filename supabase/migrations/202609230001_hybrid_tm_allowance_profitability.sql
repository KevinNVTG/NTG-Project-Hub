-- NTG Project Hub v0.10.6
-- Hybrid Allowance + T&M proposal support, union billing schedules, budgetary project estimate,
-- and INTERNAL profitability fields that are never printed on customer documents.


alter table public.commercial_proposal_settings
  drop constraint if exists commercial_proposal_settings_default_pricing_basis_check;

alter table public.commercial_proposal_settings
  add constraint commercial_proposal_settings_default_pricing_basis_check
  check (default_pricing_basis in ('lump_sum','time_and_materials','hybrid_allowance_tm','unit_price','cost_plus','gmp','not_to_exceed'));

alter table public.commercial_proposals
  drop constraint if exists commercial_proposals_pricing_basis_check;

alter table public.commercial_proposals
  add constraint commercial_proposals_pricing_basis_check
  check (pricing_basis in ('lump_sum','time_and_materials','hybrid_allowance_tm','unit_price','cost_plus','gmp','not_to_exceed'));

alter table public.commercial_proposals
  add column if not exists estimated_project_cost numeric(14,2),
  add column if not exists estimated_project_cost_notes text,
  add column if not exists show_estimated_project_cost boolean not null default true,
  add column if not exists show_client_labor_rates boolean not null default true,
  add column if not exists tm_labor_terms text;

alter table public.commercial_proposal_items
  add column if not exists internal_unit_cost numeric(14,2) not null default 0;

create table if not exists public.commercial_proposal_labor_rates (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.commercial_proposals(id) on delete cascade,
  sort_order integer not null default 0,
  classification text not null,
  client_st_rate numeric(12,2) not null default 0,
  client_ot_rate numeric(12,2) not null default 0,
  client_dt_rate numeric(12,2) not null default 0,
  internal_wage_rate numeric(12,2) not null default 0,
  internal_fringe_rate numeric(12,2) not null default 0,
  internal_burden_pct numeric(7,3) not null default 0,
  estimated_st_hours numeric(12,2) not null default 0,
  estimated_ot_hours numeric(12,2) not null default 0,
  estimated_dt_hours numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists commercial_proposal_labor_rates_updated_at on public.commercial_proposal_labor_rates;
create trigger commercial_proposal_labor_rates_updated_at
before update on public.commercial_proposal_labor_rates
for each row execute function public.set_updated_at();

alter table public.commercial_proposal_labor_rates enable row level security;
drop policy if exists "authenticated commercial proposal labor rates all" on public.commercial_proposal_labor_rates;
create policy "authenticated commercial proposal labor rates all"
on public.commercial_proposal_labor_rates for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.commercial_proposal_labor_rates to authenticated;
