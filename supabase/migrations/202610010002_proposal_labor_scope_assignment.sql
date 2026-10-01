-- NTG Project Hub v0.12.1 - assign area labor hours to CSI proposal scopes
alter table public.commercial_proposal_area_labor
  add column if not exists csi_section_id uuid references public.commercial_proposal_csi_sections(id) on delete set null;
create index if not exists commercial_proposal_area_labor_csi_section_idx
  on public.commercial_proposal_area_labor(csi_section_id);
