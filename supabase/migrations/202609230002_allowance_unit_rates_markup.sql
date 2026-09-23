-- NTG Project Hub v0.10.7
-- Explicit unit-rate material allowances with customer-visible allowance markup.

alter table public.commercial_proposal_items
  add column if not exists allowance_markup_pct numeric(7,3) not null default 0;

comment on column public.commercial_proposal_items.unit_price is
  'Customer unit price. For allowance items this is the allowance rate per selected unit (SF, LF, EA, SLAB, etc.).';

comment on column public.commercial_proposal_items.allowance_markup_pct is
  'Customer-facing contractor markup percentage applied only to allowance-category proposal items.';
