'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

function text(fd: FormData, key: string) { const v = fd.get(key); return typeof v === 'string' ? v.trim() : '' }
function num(fd: FormData, key: string) { const n = Number(text(fd,key) || 0); return Number.isFinite(n) ? n : 0 }

export async function createCommercialProposal(fd: FormData) {
  const { supabase, user } = await requireUser()
  const projectId = text(fd,'project_id')
  const { data: project } = await supabase.from('projects').select('id,customer_id,project_name,project_address').eq('id',projectId).maybeSingle()
  if (!project) throw new Error('Project not found')
  const { data: settings } = await supabase.from('commercial_proposal_settings').select('*').limit(1).maybeSingle()
  const validDays = Number(settings?.default_valid_days || 30)
  const proposalDate = text(fd,'proposal_date') || new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
  const validUntil = text(fd,'valid_until') || new Date(new Date(proposalDate+'T12:00:00').getTime()+validDays*86400000).toISOString().slice(0,10)
  const proposalScopeType = text(fd,'proposal_scope_type') || 'tile_and_stone'
  const separateTradeSheets = fd.get('separate_trade_sheets') === 'on'
  const autoTitle = proposalScopeType === 'tile_only' ? 'Commercial Tile Proposal' : proposalScopeType === 'stone_only' ? 'Commercial Stone Countertop Proposal' : 'Commercial Tile & Stone Proposal'
  const { data: proposal, error } = await supabase.from('commercial_proposals').insert({
    project_id: project.id,
    customer_id: project.customer_id,
    proposal_date: proposalDate,
    valid_until: validUntil,
    template_depth: text(fd,'template_depth') || settings?.default_template_depth || 'standard',
    pricing_basis: text(fd,'pricing_basis') || settings?.default_pricing_basis || 'lump_sum',
    proposal_scope_type: proposalScopeType,
    separate_trade_sheets: separateTradeSheets,
    title: text(fd,'title') || autoTitle,
    payment_terms: settings?.default_payment_terms || '', inclusions: settings?.default_inclusions || '', exclusions: settings?.default_exclusions || '',
    clarifications: settings?.default_clarifications || '', schedule_text: settings?.default_schedule_text || '', warranty_text: settings?.default_warranty_text || '',
    insurance_bonding: settings?.default_insurance_bonding || '', closeout_text: settings?.default_closeout_text || '', created_by:user.id,
  }).select('id').single()
  if (error || !proposal) throw new Error(error?.message || 'Could not create proposal')
  const wantedCodes = proposalScopeType === 'tile_only' ? ['09 30 00'] : proposalScopeType === 'stone_only' ? ['12 36 40'] : ['09 30 00','12 36 40']
  const { data: presets } = await supabase.from('csi_scope_presets').select('*').eq('active',true).in('csi_code',wantedCodes).order('sort_order')
  const presetRows = presets ?? []
  if (presetRows.length) await supabase.from('commercial_proposal_csi_sections').insert(presetRows.map((preset:any,index:number)=>({proposal_id:proposal.id,sort_order:index,csi_code:preset.csi_code,csi_title:preset.csi_title,scope_text:preset.default_scope || ''})))
  await supabase.from('activity_logs').insert({project_id:project.id,user_id:user.id,action:'Commercial proposal created',details:{proposal_id:proposal.id}})
  redirect(`/commercial-proposals/${proposal.id}`)
}

export async function updateCommercialProposal(id:string, fd:FormData) {
  const { supabase } = await requireUser()
  const payload:any = {
    status:text(fd,'status')||'draft', template_depth:text(fd,'template_depth')||'standard', pricing_basis:text(fd,'pricing_basis')||'lump_sum',
    proposal_scope_type:text(fd,'proposal_scope_type')||undefined, separate_trade_sheets:fd.get('separate_trade_sheets')==='on',
    proposal_date:text(fd,'proposal_date'), valid_until:text(fd,'valid_until')||null, title:text(fd,'title'), client_contact:text(fd,'client_contact'), client_email:text(fd,'client_email'), estimator:text(fd,'estimator'),
    executive_summary:text(fd,'executive_summary'), drawings_reference:text(fd,'drawings_reference'), specifications_reference:text(fd,'specifications_reference'), addenda_reference:text(fd,'addenda_reference'),
    inclusions:text(fd,'inclusions'), exclusions:text(fd,'exclusions'), clarifications:text(fd,'clarifications'), assumptions:text(fd,'assumptions'), schedule_text:text(fd,'schedule_text'), payment_terms:text(fd,'payment_terms'), warranty_text:text(fd,'warranty_text'), insurance_bonding:text(fd,'insurance_bonding'), closeout_text:text(fd,'closeout_text'), alternates_notes:text(fd,'alternates_notes'), proposal_notes:text(fd,'proposal_notes'),
    labor_rate:num(fd,'labor_rate')||null, overtime_rate:num(fd,'overtime_rate')||null, material_markup:num(fd,'material_markup')||null, equipment_markup:num(fd,'equipment_markup')||null, subcontractor_markup:num(fd,'subcontractor_markup')||null, cost_plus_fee:num(fd,'cost_plus_fee')||null, not_to_exceed_amount:num(fd,'not_to_exceed_amount')||null, gmp_amount:num(fd,'gmp_amount')||null,
  }
  const { error } = await supabase.from('commercial_proposals').update(payload).eq('id',id)
  if (error) throw new Error(error.message)
  revalidatePath(`/commercial-proposals/${id}`); revalidatePath(`/commercial-proposals/${id}/print`); revalidatePath('/commercial-proposals')
}

export async function addCsiSection(id:string, fd:FormData) {
  const { supabase } = await requireUser(); const { count } = await supabase.from('commercial_proposal_csi_sections').select('*',{count:'exact',head:true}).eq('proposal_id',id)
  const { error } = await supabase.from('commercial_proposal_csi_sections').insert({proposal_id:id,sort_order:count||0,csi_code:text(fd,'csi_code'),csi_title:text(fd,'csi_title'),scope_text:text(fd,'scope_text')})
  if (error) throw new Error(error.message); revalidatePath(`/commercial-proposals/${id}`); revalidatePath(`/commercial-proposals/${id}/print`)
}
export async function updateCsiSection(proposalId:string, sectionId:string, fd:FormData) {
  const { supabase } = await requireUser(); const { error } = await supabase.from('commercial_proposal_csi_sections').update({csi_code:text(fd,'csi_code'),csi_title:text(fd,'csi_title'),scope_text:text(fd,'scope_text')}).eq('id',sectionId)
  if (error) throw new Error(error.message); revalidatePath(`/commercial-proposals/${proposalId}`); revalidatePath(`/commercial-proposals/${proposalId}/print`)
}
export async function deleteCsiSection(proposalId:string, sectionId:string) {
  const { supabase } = await requireUser(); const { error } = await supabase.from('commercial_proposal_csi_sections').delete().eq('id',sectionId)
  if (error) throw new Error(error.message); revalidatePath(`/commercial-proposals/${proposalId}`); revalidatePath(`/commercial-proposals/${proposalId}/print`)
}
export async function addProposalItem(id:string, fd:FormData) {
  const { supabase } = await requireUser(); const { count } = await supabase.from('commercial_proposal_items').select('*',{count:'exact',head:true}).eq('proposal_id',id)
  const { error } = await supabase.from('commercial_proposal_items').insert({proposal_id:id,csi_section_id:text(fd,'csi_section_id')||null,sort_order:count||0,category:text(fd,'category')||'labor',description:text(fd,'description'),quantity:num(fd,'quantity')||1,unit:text(fd,'unit')||'LS',unit_price:num(fd,'unit_price'),is_alternate:fd.get('is_alternate')==='on',alternate_label:text(fd,'alternate_label')||null})
  if (error) throw new Error(error.message); revalidatePath(`/commercial-proposals/${id}`); revalidatePath(`/commercial-proposals/${id}/print`)
}
export async function updateProposalItem(proposalId:string,itemId:string,fd:FormData) {
  const { supabase } = await requireUser(); const { error } = await supabase.from('commercial_proposal_items').update({csi_section_id:text(fd,'csi_section_id')||null,category:text(fd,'category')||'labor',description:text(fd,'description'),quantity:num(fd,'quantity')||1,unit:text(fd,'unit')||'LS',unit_price:num(fd,'unit_price'),is_alternate:fd.get('is_alternate')==='on',alternate_label:text(fd,'alternate_label')||null}).eq('id',itemId)
  if (error) throw new Error(error.message); revalidatePath(`/commercial-proposals/${proposalId}`); revalidatePath(`/commercial-proposals/${proposalId}/print`)
}
export async function deleteProposalItem(proposalId:string,itemId:string) { const { supabase } = await requireUser(); const { error } = await supabase.from('commercial_proposal_items').delete().eq('id',itemId); if(error) throw new Error(error.message); revalidatePath(`/commercial-proposals/${proposalId}`); revalidatePath(`/commercial-proposals/${proposalId}/print`) }
