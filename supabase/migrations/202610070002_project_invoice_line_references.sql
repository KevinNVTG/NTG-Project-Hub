-- NTG Project Hub v0.13.6 - reliable project / multi-contract invoice line references
alter table public.invoice_items add column if not exists source_contract_id uuid references public.contracts(id) on delete set null;
alter table public.invoice_items add column if not exists source_project_id uuid references public.projects(id) on delete set null;
create index if not exists invoice_items_source_contract_idx on public.invoice_items(source_contract_id);
create index if not exists invoice_items_source_project_idx on public.invoice_items(source_project_id);
