-- NTG Project Hub v0.10 - Time & Materials contract and billing system
alter table public.contracts add column if not exists tm_labor_terms text;
alter table public.contracts add column if not exists tm_material_markup numeric(7,3);
alter table public.contracts add column if not exists tm_equipment_markup numeric(7,3);
alter table public.contracts add column if not exists tm_subcontractor_markup numeric(7,3);
alter table public.contracts add column if not exists tm_other_markup numeric(7,3);
alter table public.contracts add column if not exists tm_mobilization_charge numeric(12,2);
alter table public.contracts add column if not exists tm_minimum_charge numeric(12,2);
alter table public.contracts add column if not exists tm_not_to_exceed numeric(12,2);
alter table public.contracts add column if not exists tm_billing_frequency text;
alter table public.contracts add column if not exists tm_union_labor boolean not null default false;
alter table public.contracts add column if not exists tm_union_notes text;

create table if not exists public.contract_tm_rates (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  sort_order integer not null default 0,
  classification text not null,
  regular_rate numeric(12,2) not null default 0,
  overtime_rate numeric(12,2),
  double_time_rate numeric(12,2),
  unit text not null default 'HR',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists contract_tm_rates_updated_at on public.contract_tm_rates;
create trigger contract_tm_rates_updated_at before update on public.contract_tm_rates for each row execute function public.set_updated_at();
alter table public.contract_tm_rates enable row level security;
drop policy if exists "authenticated contract tm rates all" on public.contract_tm_rates;
create policy "authenticated contract tm rates all" on public.contract_tm_rates for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.contract_tm_rates to authenticated;

alter table public.invoices drop constraint if exists invoices_invoice_type_check;
alter table public.invoices add constraint invoices_invoice_type_check check (invoice_type in ('milestone','change_order','progress','final','custom','time_and_materials'));
