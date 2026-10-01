-- NTG Project Hub v0.11.9 - stone tiling CSI scope for commercial proposals
-- Adds CSI 09 30 33 Stone Tiling for natural stone floor and wall installations.

alter table public.commercial_proposals drop constraint if exists commercial_proposals_scope_type_check;
alter table public.commercial_proposals add constraint commercial_proposals_scope_type_check
  check (proposal_scope_type in (
    'tile_only',
    'stone_tiling_only',
    'stone_only',
    'tile_stone_tiling',
    'tile_and_stone',
    'stone_tiling_countertops',
    'tile_stone_tiling_countertops'
  ));

insert into public.csi_scope_presets(csi_code,csi_title,default_scope,sort_order,active)
values (
  '09 30 33',
  'Stone Tiling',
  'Furnish and/or install natural stone tiling at floors and walls as specifically identified in the proposal, drawings, finish schedules, specifications, approved selections, and clarifications. Include layout, cutting, fitting, setting, grouting or joint treatment, edge and transition coordination, and related setting materials only where specifically included in the proposal scope and pricing. Substrate correction, waterproofing, crack-isolation systems, sealing, backing assemblies, and specialty supports are included only when expressly identified.',
  15,
  true
)
on conflict (csi_code,csi_title) do update
set default_scope = excluded.default_scope,
    sort_order = excluded.sort_order,
    active = true;
