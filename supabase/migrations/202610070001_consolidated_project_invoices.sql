-- NTG Project Hub v0.13.5 - consolidated multi-project invoices
create table if not exists public.invoice_contract_links (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(invoice_id, contract_id)
);

alter table public.invoice_contract_links enable row level security;
drop policy if exists "authenticated invoice contract links all" on public.invoice_contract_links;
create policy "authenticated invoice contract links all" on public.invoice_contract_links for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.invoice_contract_links to authenticated;

-- Expand invoice type check while preserving existing values.
alter table public.invoices drop constraint if exists invoices_invoice_type_check;
alter table public.invoices add constraint invoices_invoice_type_check check (
  invoice_type in ('milestone','change_order','progress','final','custom','time_and_materials','consolidated')
);
