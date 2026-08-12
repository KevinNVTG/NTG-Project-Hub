-- NTG Project Hub v0.4 - residential contracts
create table if not exists public.contract_sequences (
  year integer primary key,
  current_value integer not null default 0
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  contract_number text unique,
  project_id uuid not null references public.projects(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  source_estimate_id uuid references public.estimates(id) on delete set null,
  status text not null default 'prepared' check (status in ('prepared','sent','signed','void')),
  effective_date date not null default current_date,
  client_name text,
  client_address text,
  project_address text,
  scope text,
  contract_price numeric(12,2) not null default 0,
  due_date_type text not null default 'no_fixed' check (due_date_type in ('no_fixed','fixed','other')),
  due_date date,
  due_date_notes text,
  additional_terms text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists contracts_source_estimate_unique
on public.contracts(source_estimate_id)
where source_estimate_id is not null;

create table if not exists public.contract_payment_milestones (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  sort_order integer not null default 0,
  description text not null,
  percentage numeric(7,3),
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.assign_contract_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  y integer := extract(year from now())::integer;
  next_value integer;
begin
  if new.contract_number is null or btrim(new.contract_number) = '' then
    insert into public.contract_sequences(year, current_value)
    values (y, 1)
    on conflict (year) do update set current_value = public.contract_sequences.current_value + 1
    returning current_value into next_value;
    new.contract_number := 'CON-' || right(y::text, 2) || '-' || lpad(next_value::text, 4, '0');
  end if;
  if new.created_by is null then new.created_by := auth.uid(); end if;
  return new;
end;
$$;

drop trigger if exists contracts_assign_number on public.contracts;
create trigger contracts_assign_number before insert on public.contracts for each row execute function public.assign_contract_number();
drop trigger if exists contracts_updated_at on public.contracts;
create trigger contracts_updated_at before update on public.contracts for each row execute function public.set_updated_at();
drop trigger if exists contract_payment_milestones_updated_at on public.contract_payment_milestones;
create trigger contract_payment_milestones_updated_at before update on public.contract_payment_milestones for each row execute function public.set_updated_at();

alter table public.contracts enable row level security;
alter table public.contract_payment_milestones enable row level security;

create policy "authenticated contracts all" on public.contracts for all to authenticated using (true) with check (true);
create policy "authenticated contract milestones all" on public.contract_payment_milestones for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.contracts, public.contract_payment_milestones to authenticated;
grant usage, select on all sequences in schema public to authenticated;
