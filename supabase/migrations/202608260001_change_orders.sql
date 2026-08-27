-- NTG Project Hub v0.7 - change orders linked to contracts
alter table public.contracts add column if not exists original_contract_price numeric(12,2);
update public.contracts set original_contract_price = contract_price where original_contract_price is null;

create table if not exists public.change_order_sequences (
  year integer primary key,
  current_value integer not null default 0
);

create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  change_order_number text unique,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','sent','approved','rejected','void')),
  revision_date date not null default current_date,
  title text not null default 'Contract Revision / Change Order',
  reason text,
  scope_revision text,
  schedule_impact text,
  payment_terms text,
  amount numeric(12,2) not null default 0,
  original_contract_price numeric(12,2) not null default 0,
  revised_contract_price numeric(12,2) not null default 0,
  approved_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists change_orders_contract_id_idx on public.change_orders(contract_id);
create index if not exists change_orders_project_id_idx on public.change_orders(project_id);

create or replace function public.assign_change_order_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  y integer := extract(year from now())::integer;
  next_value integer;
begin
  if new.change_order_number is null or btrim(new.change_order_number) = '' then
    insert into public.change_order_sequences(year, current_value)
    values (y, 1)
    on conflict (year) do update set current_value = public.change_order_sequences.current_value + 1
    returning current_value into next_value;
    new.change_order_number := 'CO-' || right(y::text, 2) || '-' || lpad(next_value::text, 4, '0');
  end if;
  if new.created_by is null then new.created_by := auth.uid(); end if;
  return new;
end;
$$;

drop trigger if exists change_orders_assign_number on public.change_orders;
create trigger change_orders_assign_number before insert on public.change_orders for each row execute function public.assign_change_order_number();
drop trigger if exists change_orders_updated_at on public.change_orders;
create trigger change_orders_updated_at before update on public.change_orders for each row execute function public.set_updated_at();

alter table public.change_orders enable row level security;
create policy "authenticated change orders all" on public.change_orders for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.change_orders to authenticated;
grant usage, select on all sequences in schema public to authenticated;
