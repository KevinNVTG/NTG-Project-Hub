-- NTG Project Hub v0.5 Vendors, Purchase Orders, and basic job costing

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  payment_terms text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_order_sequences (
  year integer primary key,
  current_value integer not null default 0
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text unique,
  project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','issued','partially_received','received','cancelled')),
  order_date date not null default current_date,
  requested_delivery_date date,
  vendor_quote_number text,
  requested_by text,
  approved_by text,
  ship_to_address text,
  notes text,
  shipping numeric(12,2) not null default 0,
  sales_tax_rate numeric(8,4) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  sort_order integer not null default 0,
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit text not null default 'EA',
  unit_cost numeric(12,2) not null default 0,
  taxable boolean not null default true,
  received_quantity numeric(12,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.assign_purchase_order_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  y integer := extract(year from now())::integer;
  next_value integer;
begin
  if new.po_number is null or btrim(new.po_number) = '' then
    insert into public.purchase_order_sequences(year, current_value)
    values (y, 1)
    on conflict (year) do update set current_value = public.purchase_order_sequences.current_value + 1
    returning current_value into next_value;
    new.po_number := 'PO-' || right(y::text, 2) || '-' || lpad(next_value::text, 4, '0');
  end if;
  if new.created_by is null then new.created_by := auth.uid(); end if;
  return new;
end;
$$;

drop trigger if exists vendors_set_created_by on public.vendors;
create trigger vendors_set_created_by before insert on public.vendors for each row execute function public.set_created_by();
drop trigger if exists vendors_updated_at on public.vendors;
create trigger vendors_updated_at before update on public.vendors for each row execute function public.set_updated_at();
drop trigger if exists purchase_orders_assign_number on public.purchase_orders;
create trigger purchase_orders_assign_number before insert on public.purchase_orders for each row execute function public.assign_purchase_order_number();
drop trigger if exists purchase_orders_updated_at on public.purchase_orders;
create trigger purchase_orders_updated_at before update on public.purchase_orders for each row execute function public.set_updated_at();
drop trigger if exists purchase_order_items_updated_at on public.purchase_order_items;
create trigger purchase_order_items_updated_at before update on public.purchase_order_items for each row execute function public.set_updated_at();

alter table public.vendors enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

create policy "authenticated vendors all" on public.vendors for all to authenticated using (true) with check (true);
create policy "authenticated purchase orders all" on public.purchase_orders for all to authenticated using (true) with check (true);
create policy "authenticated purchase order items all" on public.purchase_order_items for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.vendors, public.purchase_orders, public.purchase_order_items to authenticated;
grant usage, select on all sequences in schema public to authenticated;
