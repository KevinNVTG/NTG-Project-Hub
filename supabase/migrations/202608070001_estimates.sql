-- NTG Project Hub v0.3 - estimates
create table if not exists public.estimate_sequences (
  year integer primary key,
  current_value integer not null default 0
);

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  estimate_number text unique,
  project_id uuid not null references public.projects(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','sent','accepted','declined','expired')),
  estimate_date date not null default current_date,
  valid_until date,
  scope text,
  payment_terms text,
  exclusions text,
  notes text,
  sales_tax_rate numeric(7,4) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  sort_order integer not null default 0,
  category text not null default 'labor' check (category in ('labor','material','equipment','allowance','other')),
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit text not null default 'LS',
  unit_price numeric(12,2) not null default 0,
  taxable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.assign_estimate_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  y integer := extract(year from now())::integer;
  next_value integer;
begin
  if new.estimate_number is null or btrim(new.estimate_number) = '' then
    insert into public.estimate_sequences(year, current_value)
    values (y, 1)
    on conflict (year) do update set current_value = public.estimate_sequences.current_value + 1
    returning current_value into next_value;
    new.estimate_number := 'EST-' || right(y::text, 2) || '-' || lpad(next_value::text, 4, '0');
  end if;
  if new.created_by is null then new.created_by := auth.uid(); end if;
  return new;
end;
$$;

drop trigger if exists estimates_assign_number on public.estimates;
create trigger estimates_assign_number before insert on public.estimates for each row execute function public.assign_estimate_number();
drop trigger if exists estimates_updated_at on public.estimates;
create trigger estimates_updated_at before update on public.estimates for each row execute function public.set_updated_at();
drop trigger if exists estimate_items_updated_at on public.estimate_items;
create trigger estimate_items_updated_at before update on public.estimate_items for each row execute function public.set_updated_at();

alter table public.estimates enable row level security;
alter table public.estimate_items enable row level security;

create policy "authenticated estimates all" on public.estimates for all to authenticated using (true) with check (true);
create policy "authenticated estimate items all" on public.estimate_items for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.estimates, public.estimate_items to authenticated;
grant usage, select on all sequences in schema public to authenticated;
