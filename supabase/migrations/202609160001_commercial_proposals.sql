-- NTG Project Hub v0.9 - Commercial Proposal Suite
create table if not exists public.commercial_proposal_settings (
  id uuid primary key default gen_random_uuid(),
  default_template_depth text not null default 'standard' check (default_template_depth in ('compact','standard','detailed')),
  default_pricing_basis text not null default 'lump_sum' check (default_pricing_basis in ('lump_sum','time_and_materials','unit_price','cost_plus','gmp','not_to_exceed')),
  default_valid_days integer not null default 30,
  default_payment_terms text,
  default_inclusions text,
  default_exclusions text,
  default_clarifications text,
  default_schedule_text text,
  default_warranty_text text,
  default_insurance_bonding text,
  default_closeout_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.csi_scope_presets (
  id uuid primary key default gen_random_uuid(),
  csi_code text not null,
  csi_title text not null,
  default_scope text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(csi_code, csi_title)
);

create table if not exists public.commercial_proposal_sequences (
  year integer primary key,
  current_value integer not null default 0
);

create table if not exists public.commercial_proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_number text unique,
  project_id uuid not null references public.projects(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','sent','revised','accepted','declined','expired')),
  template_depth text not null default 'standard' check (template_depth in ('compact','standard','detailed')),
  pricing_basis text not null default 'lump_sum' check (pricing_basis in ('lump_sum','time_and_materials','unit_price','cost_plus','gmp','not_to_exceed')),
  proposal_date date not null default current_date,
  valid_until date,
  title text not null default 'Commercial Tile & Stone Proposal',
  client_contact text,
  client_email text,
  estimator text default 'Kevin Melendez',
  executive_summary text,
  drawings_reference text,
  specifications_reference text,
  addenda_reference text,
  inclusions text,
  exclusions text,
  clarifications text,
  assumptions text,
  schedule_text text,
  payment_terms text,
  warranty_text text,
  insurance_bonding text,
  closeout_text text,
  alternates_notes text,
  proposal_notes text,
  labor_rate numeric(12,2),
  overtime_rate numeric(12,2),
  material_markup numeric(7,3),
  equipment_markup numeric(7,3),
  subcontractor_markup numeric(7,3),
  cost_plus_fee numeric(7,3),
  not_to_exceed_amount numeric(12,2),
  gmp_amount numeric(12,2),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commercial_proposal_csi_sections (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.commercial_proposals(id) on delete cascade,
  sort_order integer not null default 0,
  csi_code text not null,
  csi_title text not null,
  scope_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commercial_proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.commercial_proposals(id) on delete cascade,
  csi_section_id uuid references public.commercial_proposal_csi_sections(id) on delete set null,
  sort_order integer not null default 0,
  category text not null default 'labor' check (category in ('labor','material','equipment','subcontract','allowance','other')),
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit text not null default 'LS',
  unit_price numeric(12,2) not null default 0,
  is_alternate boolean not null default false,
  alternate_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.assign_commercial_proposal_number()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  y integer := extract(year from now())::integer;
  next_value integer;
begin
  if new.proposal_number is null or btrim(new.proposal_number) = '' then
    insert into public.commercial_proposal_sequences(year, current_value)
    values (y, 1)
    on conflict (year) do update set current_value = public.commercial_proposal_sequences.current_value + 1
    returning current_value into next_value;
    new.proposal_number := 'CP-' || right(y::text, 2) || '-' || lpad(next_value::text, 4, '0');
  end if;
  if new.created_by is null then new.created_by := auth.uid(); end if;
  return new;
end;
$$;

drop trigger if exists commercial_proposals_assign_number on public.commercial_proposals;
create trigger commercial_proposals_assign_number before insert on public.commercial_proposals for each row execute function public.assign_commercial_proposal_number();
drop trigger if exists commercial_proposals_updated_at on public.commercial_proposals;
create trigger commercial_proposals_updated_at before update on public.commercial_proposals for each row execute function public.set_updated_at();
drop trigger if exists commercial_proposal_settings_updated_at on public.commercial_proposal_settings;
create trigger commercial_proposal_settings_updated_at before update on public.commercial_proposal_settings for each row execute function public.set_updated_at();
drop trigger if exists csi_scope_presets_updated_at on public.csi_scope_presets;
create trigger csi_scope_presets_updated_at before update on public.csi_scope_presets for each row execute function public.set_updated_at();
drop trigger if exists commercial_proposal_csi_sections_updated_at on public.commercial_proposal_csi_sections;
create trigger commercial_proposal_csi_sections_updated_at before update on public.commercial_proposal_csi_sections for each row execute function public.set_updated_at();
drop trigger if exists commercial_proposal_items_updated_at on public.commercial_proposal_items;
create trigger commercial_proposal_items_updated_at before update on public.commercial_proposal_items for each row execute function public.set_updated_at();

insert into public.commercial_proposal_settings(
  default_payment_terms, default_inclusions, default_exclusions, default_clarifications,
  default_schedule_text, default_warranty_text, default_insurance_bonding, default_closeout_text
)
select
  'Progress billing in accordance with the accepted proposal, contract documents, approved schedule of values, and project requirements. Payment terms may be revised for a specific project.',
  'Provide labor, supervision, installation materials, equipment, delivery, layout, cutting, setting, grouting, cleaning, and related work specifically identified in the proposal scope.',
  'Work not specifically identified in the proposal scope is excluded. Substrate correction, leveling, structural work, hazardous-material abatement, permits, engineering, after-hours work, and premium freight are excluded unless expressly listed.',
  'Pricing is based on the drawings, specifications, addenda, quantities, and clarifications identified in this proposal. Conflicts or changes after bid may require written adjustment.',
  'Work will be coordinated with the General Contractor project schedule, site readiness, material availability, and approved sequencing.',
  'Nevada Tile & Granite warrants its workmanship in accordance with the executed contract and applicable project requirements. Manufacturer warranties remain subject to manufacturer terms.',
  'Nevada Tile & Granite maintains required Nevada contractor licensing and commercial insurance. Project-specific certificates, additional insured requirements, bonding, or special limits are subject to contract requirements and availability.',
  'Closeout items specifically required by the contract documents may include attic stock, product data, warranties, care information, and final documentation as applicable.'
where not exists (select 1 from public.commercial_proposal_settings);

insert into public.csi_scope_presets(csi_code,csi_title,default_scope,sort_order)
values
  ('09 30 00','Tiling','Furnish and/or install tile systems as specifically identified in the proposal, drawings, finish schedules, specifications, and clarifications.',10),
  ('12 36 00','Countertops','Fabricate and/or install stone or solid-surface countertop work as specifically identified in the proposal scope and contract documents.',20)
on conflict (csi_code,csi_title) do nothing;

alter table public.commercial_proposal_settings enable row level security;
alter table public.csi_scope_presets enable row level security;
alter table public.commercial_proposals enable row level security;
alter table public.commercial_proposal_csi_sections enable row level security;
alter table public.commercial_proposal_items enable row level security;

create policy "authenticated proposal settings all" on public.commercial_proposal_settings for all to authenticated using (true) with check (true);
create policy "authenticated csi presets all" on public.csi_scope_presets for all to authenticated using (true) with check (true);
create policy "authenticated commercial proposals all" on public.commercial_proposals for all to authenticated using (true) with check (true);
create policy "authenticated commercial proposal sections all" on public.commercial_proposal_csi_sections for all to authenticated using (true) with check (true);
create policy "authenticated commercial proposal items all" on public.commercial_proposal_items for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.commercial_proposal_settings, public.csi_scope_presets, public.commercial_proposals, public.commercial_proposal_csi_sections, public.commercial_proposal_items to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Common contract/pricing basis selector. Existing contracts default to Lump Sum.
alter table public.contracts add column if not exists pricing_basis text not null default 'lump_sum';
alter table public.contracts drop constraint if exists contracts_pricing_basis_check;
alter table public.contracts add constraint contracts_pricing_basis_check check (pricing_basis in ('lump_sum','time_and_materials','unit_price','cost_plus','gmp','not_to_exceed'));
