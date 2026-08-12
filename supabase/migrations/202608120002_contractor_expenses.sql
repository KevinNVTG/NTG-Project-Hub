-- NTG Project Hub v0.4.1 - customizable contractor expenses per contract
alter table public.contracts
  add column if not exists contractor_expenses text not null default '';

comment on column public.contracts.contractor_expenses is
  'Project-specific expenses/materials the contractor agrees to provide; printed in Section 6 of the residential contract.';
