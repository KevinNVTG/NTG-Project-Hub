-- NTG Project Hub v0.10.3 - separate tile and stone commercial proposal scopes
alter table public.commercial_proposals
  add column if not exists proposal_scope_type text not null default 'tile_and_stone',
  add column if not exists separate_trade_sheets boolean not null default true;

alter table public.commercial_proposals drop constraint if exists commercial_proposals_scope_type_check;
alter table public.commercial_proposals add constraint commercial_proposals_scope_type_check
  check (proposal_scope_type in ('tile_only','stone_only','tile_and_stone'));

-- Keep the legacy generic countertop preset available but inactive; use the specific
-- MasterFormat work result requested for NTG stone countertop proposals.
update public.csi_scope_presets
set active = false
where csi_code = '12 36 00' and csi_title = 'Countertops';

insert into public.csi_scope_presets(csi_code,csi_title,default_scope,sort_order,active)
values (
  '12 36 40',
  'Stone Countertops',
  'Fabricate and/or install stone countertop work as specifically identified in the proposal, drawings, finish schedules, specifications, approved selections, and clarifications. Include field verification, fabrication, finished edges, cutouts, seams, delivery, setting, and related work only where specifically listed in the proposal pricing and scope.',
  20,
  true
)
on conflict (csi_code,csi_title) do update
set default_scope = excluded.default_scope, sort_order = excluded.sort_order, active = true;

insert into public.csi_scope_presets(csi_code,csi_title,default_scope,sort_order,active)
values (
  '09 30 00',
  'Tiling',
  'Furnish and/or install tile systems as specifically identified in the proposal, drawings, finish schedules, specifications, and clarifications.',
  10,
  true
)
on conflict (csi_code,csi_title) do update
set default_scope = excluded.default_scope, sort_order = excluded.sort_order, active = true;
