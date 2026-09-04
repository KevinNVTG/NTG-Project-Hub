-- NTG Project Hub v0.8 - customer invoicing and payments
create table if not exists public.invoice_sequences (
  year integer primary key,
  current_value integer not null default 0
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique,
  project_id uuid not null references public.projects(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null,
  source_milestone_id uuid references public.contract_payment_milestones(id) on delete set null,
  source_change_order_id uuid references public.change_orders(id) on delete set null,
  invoice_type text not null default 'custom' check (invoice_type in ('milestone','change_order','progress','final','custom')),
  status text not null default 'draft' check (status in ('draft','sent','partially_paid','paid','overdue','void')),
  invoice_date date not null default ((now() at time zone 'America/Los_Angeles')::date),
  due_date date,
  client_name text,
  client_address text,
  project_address text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  sort_order integer not null default 0,
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit text not null default 'LS',
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete set null,
  payment_date date not null default ((now() at time zone 'America/Los_Angeles')::date),
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'check' check (payment_method in ('check','ach','cash','card','wire','other')),
  reference_number text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create unique index if not exists invoices_source_milestone_unique on public.invoices(source_milestone_id) where source_milestone_id is not null and status <> 'void';
create unique index if not exists invoices_source_change_order_unique on public.invoices(source_change_order_id) where source_change_order_id is not null and status <> 'void';

create or replace function public.assign_invoice_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  y integer := extract(year from (now() at time zone 'America/Los_Angeles'))::integer;
  next_value integer;
begin
  if new.invoice_number is null or btrim(new.invoice_number) = '' then
    insert into public.invoice_sequences(year, current_value) values (y, 1)
    on conflict (year) do update set current_value = public.invoice_sequences.current_value + 1
    returning current_value into next_value;
    new.invoice_number := 'INV-' || right(y::text, 2) || '-' || lpad(next_value::text, 4, '0');
  end if;
  if new.created_by is null then new.created_by := auth.uid(); end if;
  return new;
end;
$$;

drop trigger if exists invoices_assign_number on public.invoices;
create trigger invoices_assign_number before insert on public.invoices for each row execute function public.assign_invoice_number();
drop trigger if exists invoices_updated_at on public.invoices;
create trigger invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();
drop trigger if exists invoice_items_updated_at on public.invoice_items;
create trigger invoice_items_updated_at before update on public.invoice_items for each row execute function public.set_updated_at();

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
create policy "authenticated invoices all" on public.invoices for all to authenticated using (true) with check (true);
create policy "authenticated invoice items all" on public.invoice_items for all to authenticated using (true) with check (true);
create policy "authenticated payments all" on public.payments for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.invoices, public.invoice_items, public.payments to authenticated;
grant usage, select on all sequences in schema public to authenticated;
