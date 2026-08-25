-- NTG Project Hub v0.6 - Stone Slab Pricing Library
create table if not exists public.stone_slabs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  material_type text not null default 'Quartz' check (material_type in ('Quartz','Granite','Quartzite','Marble','Porcelain','Other')),
  supplier text,
  color text,
  sku text,
  slab_size text,
  estimate_price numeric(12,2) not null default 0,
  internal_cost numeric(12,2) not null default 0,
  notes text,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists stone_slabs_updated_at on public.stone_slabs;
create trigger stone_slabs_updated_at before update on public.stone_slabs for each row execute function public.set_updated_at();

create or replace function public.stone_slabs_set_created_by()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is null then new.created_by := auth.uid(); end if;
  return new;
end;
$$;

drop trigger if exists stone_slabs_set_created_by on public.stone_slabs;
create trigger stone_slabs_set_created_by before insert on public.stone_slabs for each row execute function public.stone_slabs_set_created_by();

alter table public.stone_slabs enable row level security;
drop policy if exists "authenticated stone slabs all" on public.stone_slabs;
create policy "authenticated stone slabs all" on public.stone_slabs for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.stone_slabs to authenticated;
