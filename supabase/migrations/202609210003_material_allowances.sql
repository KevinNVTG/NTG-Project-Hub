-- NTG Project Hub v0.10.1 - reusable material allowance schedules
alter table public.contracts add column if not exists material_allowance_terms text;

create table if not exists public.contract_material_allowances (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  sort_order integer not null default 0,
  category text,
  description text not null,
  quantity numeric(12,3),
  unit text,
  allowance_amount numeric(14,2) not null default 0,
  actual_cost numeric(14,2),
  markup_applies boolean not null default false,
  markup_percent numeric(7,3),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists contract_material_allowances_updated_at on public.contract_material_allowances;
create trigger contract_material_allowances_updated_at before update on public.contract_material_allowances for each row execute function public.set_updated_at();
alter table public.contract_material_allowances enable row level security;
drop policy if exists "authenticated contract material allowances all" on public.contract_material_allowances;
create policy "authenticated contract material allowances all" on public.contract_material_allowances for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.contract_material_allowances to authenticated;
