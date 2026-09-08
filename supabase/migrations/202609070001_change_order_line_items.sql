-- NTG Project Hub v0.8.1 - optional material/labor detail on change orders
create table if not exists public.change_order_items (
  id uuid primary key default gen_random_uuid(),
  change_order_id uuid not null references public.change_orders(id) on delete cascade,
  category text not null default 'labor' check (category in ('labor','material','equipment','allowance','other')),
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit text not null default 'LS',
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists change_order_items_change_order_id_idx on public.change_order_items(change_order_id);
drop trigger if exists change_order_items_updated_at on public.change_order_items;
create trigger change_order_items_updated_at before update on public.change_order_items for each row execute function public.set_updated_at();
alter table public.change_order_items enable row level security;
drop policy if exists "authenticated change order items all" on public.change_order_items;
create policy "authenticated change order items all" on public.change_order_items for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.change_order_items to authenticated;
