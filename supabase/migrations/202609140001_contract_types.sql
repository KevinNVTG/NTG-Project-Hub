-- NTG Project Hub v0.8.2 - residential and commercial contract types
alter table public.contracts
  add column if not exists contract_type text not null default 'residential';

alter table public.contracts
  drop constraint if exists contracts_contract_type_check;
alter table public.contracts
  add constraint contracts_contract_type_check check (contract_type in ('residential','commercial'));

alter table public.contracts
  add column if not exists commercial_payment_terms text;
alter table public.contracts
  add column if not exists exclusions_clarifications text;

-- Bring existing contracts in line with the project type when possible.
update public.contracts c
set contract_type = 'commercial'
from public.projects p
where c.project_id = p.id
  and p.project_type = 'commercial'
  and c.contract_type <> 'commercial';

update public.contracts c
set contract_type = 'residential'
from public.projects p
where c.project_id = p.id
  and p.project_type = 'residential'
  and c.contract_type not in ('residential','commercial');
