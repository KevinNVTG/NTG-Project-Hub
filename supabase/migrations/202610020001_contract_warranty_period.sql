alter table public.contracts
  add column if not exists warranty_years integer not null default 1;

update public.contracts
set warranty_years = 1
where warranty_years is null or warranty_years not in (1, 2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contracts_warranty_years_check'
      and conrelid = 'public.contracts'::regclass
  ) then
    alter table public.contracts
      add constraint contracts_warranty_years_check
      check (warranty_years in (1, 2));
  end if;
end $$;
